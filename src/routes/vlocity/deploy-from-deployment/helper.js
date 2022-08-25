const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');
const childProcess = require('../../../services/child-process');
const constants = require('../../../constants');

function retrieveSourceComponents(jsForceConnection, nameSpacePrefix, deploymentId, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Retrieve Components Ids');
      const componentIdList = [];
      jsForceConnection.query(
        `SELECT Id FROM ${nameSpacePrefix}Patch_Manifest__c WHERE ${nameSpacePrefix}Patch__c = '${deploymentId}'`,
        (err, result) => {
          if (err) {
            reject(err);
          }
          result.records.forEach((item) => componentIdList.push(item.Id));
          if (!result.done) {
            retrieveSourceComponentsMore(jsForceConnection, result.nextRecordsUrl, componentIdList)
              .then((result) => {
                log.log(`Component Id List Length, ${result.length}`);
                log.log('End Retrieve Components Ids');
                resolve(result);
              })
              .catch((error) => {
                log.log('Error Retrieve Components Ids');
                reject(error);
              });
          } else {
            log.log(`Component Id List Length, ${componentIdList.length}`);
            log.log('End Retrieve Components Ids');
            resolve(componentIdList);
          }
        },
      );
    } catch (error) {
      log.log('Error Retrieve Components Ids');
      reject(error);
    }
  });
}

function retrieveSourceComponentsMore(jsForceConnection, queryLocator, componentIdList) {
  return new Promise((resolve, reject) => {
    try {
      jsForceConnection.queryMore(queryLocator)
        .then((result) => {
          if (!result.done) {
            retrieveSourceComponentsMore(jsForceConnection, queryLocator, componentIdList)
              .then((result) => resolve(result))
              .catch((error) => reject(error));
          } else {
            resolve(componentIdList);
          }
        });
    } catch (e) {
      reject(e);
    }
  });
}

function retrieveVlocityAttachments(jsForceConnection, restUrlFlosumGetAttachments, componentIdList, log, componentWithAttachmentList = []) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Retrieve Vlocity Attachments');
      callRetrieveVlocityAttachments(jsForceConnection, restUrlFlosumGetAttachments, componentIdList, componentIdList.length, log, componentWithAttachmentList = [])
        .then((result) => {
          log.log('End Retrieve Vlocity Attachments');
          resolve(result);
        })
        .catch((error) => {
          log.log('Error Retrieve Vlocity Attachments');
          reject(error);
        });
    } catch (error) {
      log.log('Error Retrieve Vlocity Attachments');
      reject(error);
    }
  });
}

function callRetrieveVlocityAttachments(jsForceConnection, restUrlFlosumGetAttachments, componentIdList, componentIdListLength, log, componentWithAttachmentList = []) {
  return new Promise(((resolve, reject) => {
    try {
      const body = { parentIds: componentIdList };
      jsForceConnection.apex.post(restUrlFlosumGetAttachments, body)
        .then((res) => {
          componentWithAttachmentList.push(...res.records);
          log.log(`Retrieved: ${Number.parseFloat((componentWithAttachmentList.length / componentIdListLength) * 100).toFixed(2)}%`);
          if (res.ids.length && componentIdList.length !== componentWithAttachmentList.length) {
            callRetrieveVlocityAttachments(jsForceConnection, restUrlFlosumGetAttachments, res.ids, componentIdListLength, log, componentWithAttachmentList)
              .then(() => resolve(componentWithAttachmentList))
              .catch((error) => {
                reject(error);
              });
          } else {
            resolve(componentWithAttachmentList);
          }
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  }));
}

function unzipComponentList(bufferedComponentList, projectName, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Unzip Component List');
      let b64ToBlobPromiseChain = Promise.resolve();
      bufferedComponentList.forEach((comp) => {
        b64ToBlobPromiseChain = b64ToBlobPromiseChain
          .then(() => unzipBuffer(comp, projectName));
      });
      b64ToBlobPromiseChain
        .then(() => {
          log.log('End Unzip Component List');
          resolve();
        })
        .catch((e) => {
          log.log(`Error Unzip Component List ${e}`);
          reject(e);
        });
    } catch (e) {
      log.log(`Error Unzip Component List ${e}`);
      reject(e);
    }
  });
}

function unzipBuffer(comp, projectName) {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(Buffer.from(comp, 'base64'));
      const projectDataPath = `${projectName}/${constants.UNZIP_CATALOG_NAME}`;
      zip.extractAllTo(projectDataPath, false);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function deployData(projectName, vlocityUrl, vlocityToken, isSeparateMatrixVersions, isSeparateCalculationProcedureVersions, isEnabledApexPostDeploy, apexPath, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Deploy Data');
      const command = 'vlocity';
      const commandProperties = [
        '-sf.accessToken', `${vlocityToken}`,
        '-sf.instanceUrl', `${vlocityUrl}`,
        '-job', `${constants.JOB_FILE_NAME}`,
        '-autoRetryErrors',
      ];

      if (!!isSeparateMatrixVersions) {
        commandProperties.push('-separateMatrixVersions');
      }

      if (!!isSeparateCalculationProcedureVersions) {
        commandProperties.push('-separateCalculationProcedureVersions');
      }

      commandProperties.push('packDeploy');

      if (isEnabledApexPostDeploy) {
        commandProperties.push('runApex');
        commandProperties.push('-apex');
        commandProperties.push(apexPath);
      }

      log.log(commandProperties.slice(2).join(' '));

      const options = { cwd: `./${projectName}`, maxBuffer: 1024 * 500 };
      childProcess.callChildProcess(command, commandProperties, log, options)
        .then((result) => {
          log.log('End Deploy Data');
          resolve(result);
        })
        .catch((error) => {
          log.log(`Error Deploy Data ${error}`);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

function getTime() {
  const date = new Date();
  const values = [date.getDate(), date.getMonth() + 1, date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds()];
  values.forEach((value) => value = value.toString().replace(/^([0-9])$/, '0$1'));
  return `${values[2]}-${values[1]}-${values[0]} ${values[3]}:${values[4]}:${values[5]}`;
}

module.exports = {
  retrieveSourceComponents,
  retrieveVlocityAttachments,
  unzipComponentList,
  deployData,
  getTime,
};
