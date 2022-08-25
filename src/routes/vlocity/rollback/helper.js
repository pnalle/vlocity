const fs = require('fs');
const childProcess = require('../../../services/child-process');
const constants = require('../../../constants');
const http = require('../../../services/http');

function deployData(projectName, vlocityUrl, vlocityToken, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Deploy Data');
      const command = 'vlocity';
      const commandProperties = [
        '-sf.accessToken', vlocityToken,
        '-sf.instanceUrl', vlocityUrl,
        '-job', constants.JOB_FILE_NAME,
        '-autoRetryErrors',
        'packDeploy'
      ];

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

function filterBySelectedKeys(projectName, componentKeyList, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Filter By Selected Keys');
      const requiredComponentTypeSet = new Set();
      componentKeyList.forEach((key) => {
        const paramList = key.split('/');
        if (paramList.length > 1) {
          requiredComponentTypeSet.add(paramList[0]);
        }
      });

      const allComponentTypeList = fs.readdirSync(`${projectName}/${constants.SOURCE_FOLDER}`);

      allComponentTypeList.forEach((type) => {
        if (requiredComponentTypeSet.has(type)) {
          const allComponentNameList = fs.readdirSync(`${projectName}/${constants.SOURCE_FOLDER}/${type}`);
          allComponentNameList.forEach((name) => {
            if (!componentKeyList.includes(`${type}/${name}`)) {
              fs.rmdirSync(`./${projectName}/${constants.SOURCE_FOLDER}/${type}/${name}`, { recursive: true });
            }
          });
        } else {
          fs.rmdirSync(`./${projectName}/${constants.SOURCE_FOLDER}/${type}`, { recursive: true });
        }
      });
      resolve();
      log.log('End Filter By Selected Keys');
    } catch (e) {
      log.log(`Error Filter By Selected Keys`);
      reject(e);
    }
  });
}

function addDeploymentStatusAttachments(flosumUrl, flosumToken, nameSpacePrefix, metadataLogId, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Add Deployment Status Attachments');
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;

      const resBody = { deploymentResultList: [], metadataLogId };
      const body = { methodType: constants.METHOD_ADD_DEPLOYMENT_STATUS_ATTACHMENTS, body: JSON.stringify(resBody) };

      http.post(url, flosumToken, nameSpacePrefix, body)
        .then(() => {
          log.log('End Add Deployment Status Attachments');
          resolve();
        })
        .catch((e) => {
          log.log(`Error Add Deployment Status Attachments`);
          reject(e);
        });
    } catch (e) {
      log.log(`Error Add Deployment Status Attachments`);
      reject(e);
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
  deployData,
  getTime,
  addDeploymentStatusAttachments,
  filterBySelectedKeys
}
