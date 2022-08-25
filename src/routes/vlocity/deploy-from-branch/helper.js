const fs = require('fs');
const AdmZip = require('adm-zip');
const yaml = require('js-yaml');
const childProcess = require('../../../services/child-process');
const constants = require('../../../constants');
const http = require('../../../services/http');
const storage = require('../../../services/storage');

function retrieveBranchComponents(flosumUrl, flosumToken, branchId, nameSpacePrefix, componentsCount, log, componentIdListJson = null) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Retrieve Vlocity Attachments');
      callBranchComponentList(flosumUrl, flosumToken, branchId, nameSpacePrefix, componentsCount, componentIdListJson, log)
        .then((result) => {
          log.log('End  Retrieve Vlocity Attachments');
          resolve(result);
        })
        .catch((error) => {
          log.log(`Error  Retrieve Vlocity Attachments ${error}`);
          reject(error);
        });
    } catch (error) {
      log.log(`Error  Retrieve Vlocity Attachments ${error}`);
      reject(error);
    }
  });
}

function callBranchComponentList(
  flosumUrl,
  flosumToken,
  branchId,
  nameSpacePrefix,
  componentsCount,
  componentIdListJson,
  log,
  lastComponentId = '',
  componentsWithAttachmentList = [],
) {
  return new Promise((resolve, reject) => {
    try {
      const prefix = nameSpacePrefix ? `${nameSpacePrefix.replace('__', '')}/` : '';
      const url = `${flosumUrl}/services/apexrest/${prefix}unlocked-packages`;
      const resBody = { branchId, lastComponentId, componentIdListJson };
      const body = { methodType: constants.METHOD_TYPE_GET_BRANCH_ATTACHMENTS, body: JSON.stringify(resBody) };
      http.post(url, flosumToken, nameSpacePrefix, body)
        .then((response) => {
          let { data } = response;
          data = JSON.parse(data);
          log.log(`Retrieved: ${Number.parseFloat((componentsWithAttachmentList.length / componentsCount) * 100).toFixed(2)}%`);
          componentsWithAttachmentList.push(...data.attachmentPackage.recordList);
          if (data.lastComponentId !== '-1') {
            if (data.attachmentPackage.idList && data.attachmentPackage.idList.length) {
              http.callComponentList(flosumUrl, flosumToken, data.attachmentPackage.idList, nameSpacePrefix, componentsCount, log, componentsWithAttachmentList)
                .then((result) => callBranchComponentList(flosumUrl, flosumToken, branchId, nameSpacePrefix, componentsCount, componentIdListJson, log, data.lastComponentId, result))
                .then((result) => resolve(result))
                .catch((error) => reject(error));
            } else {
              callBranchComponentList(flosumUrl, flosumToken, branchId, nameSpacePrefix, componentsCount, componentIdListJson, log, data.lastComponentId, componentsWithAttachmentList)
                .then((result) => resolve(result))
                .catch((e) => {
                  reject(e);
                });
            }
          } else {
            resolve(componentsWithAttachmentList);
          }
        }).catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

function backupData(flosumUrl, flosumToken, nameSpacePrefix, metadataLogId, projectName, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Backup Data');
      createBackupChunks(projectName, log)
        .then((zipChunkList) => deployBackup(flosumUrl, flosumToken, nameSpacePrefix, metadataLogId, zipChunkList, log))
        .then(() => {
          log.log('End Backup Data');
          resolve();
        })
        .catch((e) => {
          log.log(`Error Backup Data ${e}`);
          reject(e);
        });
    } catch (e) {
      log.log(`Error Backup Data ${e}`);
      reject(e);
    }
  });
}

function getFolderSize(folderName) {
  let size = 0;
  const componentFilenameList = fs.readdirSync(folderName);
  componentFilenameList.forEach((filename) => {
    const info = fs.lstatSync(`${folderName}/${filename}`);
    if (info.isDirectory()) {
      size += getFolderSize(`${folderName}/${filename}`);
    } else {
      size += info.size;
    }
  });
  return size;
}

function createBackupChunks(projectName, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Create Backup Chunks');
      const zipChunkList = [];
      if (fs.existsSync(`${projectName}/${constants.SOURCE_FOLDER}`)) {
        let zip = new AdmZip();
        let size = 0;
        const typeNameList = fs.readdirSync(`${projectName}/${constants.SOURCE_FOLDER}`);
        typeNameList.forEach((typeFolder) => {
          const componentFolderList = fs.readdirSync(`${projectName}/${constants.SOURCE_FOLDER}/${typeFolder}`);
          componentFolderList.forEach((componentFolder) => {
            const folderName = `${projectName}/${constants.SOURCE_FOLDER}/${typeFolder}/${componentFolder}`;
            const folderSize = getFolderSize(folderName);

            if (size + folderSize > constants.MAX_SIZE_UNZIP_ATTACHMENT) {
              zipChunkList.push(zip.toBuffer().toString('base64'));
              zip = new AdmZip();
              zip.addLocalFolder(folderName, `${typeFolder}/${componentFolder}`);
              log.log(`Backup Chunk prepared, size = ${size}`);
              size = folderSize;
            } else {
              size += folderSize;
              zip.addLocalFolder(folderName, `${typeFolder}/${componentFolder}`);
            }
          });
        });
        zipChunkList.push(zip.toBuffer().toString('base64'));
        log.log(`End Create Backup Chunks, size = ${zipChunkList.length}`);
        resolve(zipChunkList);
      }
    } catch (e) {
      log.log(`Error Create Backup Chunks ${e}`);
      reject(e);
    }
  });
}

function deployBackup(flosumUrl, flosumToken, nameSpacePrefix, metadataLogId, zipChunkList, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Deploy Backup Chunks');
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;
      let promiseChain = Promise.resolve();
      zipChunkList.forEach((vlocityBackupZip, i) => {
        promiseChain = promiseChain.then(() => {
          const resBody = { vlocityBackupZip, metadataLogId };
          const body = { methodType: constants.METHOD_VLOCITY_BACKUP, body: JSON.stringify(resBody) };
          return http.post(url, flosumToken, nameSpacePrefix, body)
            .then(() => log.log(`${i + 1} Chunks From ${zipChunkList.length} Deployed.`));
        });
      });

      promiseChain
        .then(() => {
          log.log('End Deploy Backup Chunks');
          resolve();
        })
        .catch((e) => {
          log.log(`Error Deploy Backup Chunks ${e}`);
          reject(e);
        });
    } catch (e) {
      log.log(`Error Deploy Backup Chunks ${e}`);
      reject(e);
    }
  });
}

function deployData(
  projectName,
  jsForceConnection,
  attachmentLogId,
  vlocityUrl,
  vlocityToken,
  isSeparateMatrixVersions,
  isSeparateCalculationProcedureVersions,
  isEnabledApexPostDeploy,
  apexPath,
  isShowLogs,
  log,
) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Deploy Data');
      const command = 'vlocity';
      const commandProperties = [
        '-sf.accessToken', vlocityToken,
        '-sf.instanceUrl', vlocityUrl,
        '-job', constants.JOB_FILE_NAME,
        '-autoRetryErrors',
      ];

      if (isSeparateMatrixVersions) {
        commandProperties.push('-separateMatrixVersions');
      }

      if (isSeparateCalculationProcedureVersions) {
        commandProperties.push('-separateCalculationProcedureVersions');
      }

      commandProperties.push('packDeploy');

      if (isEnabledApexPostDeploy) {
        commandProperties.push('runApex');
        commandProperties.push('-apex');
        commandProperties.push(apexPath);
      }

      log.log(commandProperties.slice(2).join(' '));

      function callUpdate() {
        http.updateAttachmentLog(projectName, jsForceConnection, attachmentLogId, log, false)
      }
      const options = { cwd: `./${projectName}`, maxBuffer: 1024 * 500 };
      childProcess.callChildProcess(command, commandProperties, log, options, isShowLogs, callUpdate)
        .then((result) => {
          log.log('End Deploy Data');
          resolve(result);
        })
        .catch((error) => {
          log.log(`Error Deploy Data ${error}`);
          reject(error);
        });
    } catch (error) {
      log.log(`Error Deploy Data ${error}`);
      reject(error);
    }
  });
}

function addDeploymentStatusAttachments(flosumUrl, flosumToken, nameSpacePrefix, metadataLogId, jobsInfo, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Add Deployment Status Attachments');
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;

      const deploymentResultList = [];

      if (jobsInfo) {
        jobsInfo = JSON.parse(jobsInfo);
        Object.keys(jobsInfo.currentStatus).forEach((key) => {
          const componentInfoList = key.split('/');
          if (componentInfoList.length === 2) {
            const componentType = componentInfoList[0];
            const componentName = componentInfoList[1];
            const status = jobsInfo.currentStatus[key] === 'Success'
              ? jobsInfo.currentStatus[key]
              : jobsInfo.currentStatus[key] === 'Error'
                ? 'Failure'
                : null;
            const errorMessage = jobsInfo.currentErrors[key] ? jobsInfo.currentErrors[key] : null;
            const result = status === 'Success' ? 'CREATED' : null;
            deploymentResultList.push({
              componentName,
              componentType,
              status,
              result,
              errorMessage,
            });
          }
        });
      }

      const resBody = { deploymentResultList, metadataLogId };
      const body = { methodType: constants.METHOD_ADD_DEPLOYMENT_STATUS_ATTACHMENTS, body: JSON.stringify(resBody) };

      http.post(url, flosumToken, nameSpacePrefix, body)
        .then(() => {
          log.log('End Add Deployment Status Attachments');
          resolve();
        })
        .catch((e) => {
          log.log('Error Add Deployment Status Attachments ' + e);
          reject(e);
        });
    } catch (e) {
      log.log('Error Add Deployment Status Attachments ' + e);
      reject(e);
    }
  });
}

function resolvePromise(promise) {
  return new Promise((resolve, reject) => {
    try {
      promise
        .then(resolve)
        .catch(resolve);
    } catch (e) {
      reject(e);
    }
  });
}

function createVlocityTempZip(projectName, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Create Vlocity Temp Zip');
      const vlocityTempPath = `${projectName}/${constants.VLOCITY_TEMP_CATALOG}`;
      if (fs.existsSync(vlocityTempPath)) {
        const vlocityTempLogPath = `${vlocityTempPath}/logs`;
        if (log.errors.length && fs.existsSync(vlocityTempLogPath)) {
          const logFileList = fs.readdirSync(vlocityTempLogPath);
          if (logFileList && logFileList.length) {
            const logFileName = logFileList[0];
            if (logFileName.includes('job-yaml-') && logFileName.includes('-Export.yaml')) {
              const flosumErrorsText = `FlosumErrors: ${JSON.stringify(log.errors)}`;
              fs.appendFileSync(`./${vlocityTempLogPath}/${logFileName}`, flosumErrorsText);
            }
          }
        }
        const zip = new AdmZip();
        zip.addLocalFolder(vlocityTempPath, constants.VLOCITY_TEMP_CATALOG);
        resolve(zip.toBuffer().toString('base64'));
        log.log('End Create Vlocity Temp Zip');
      } else {
        log.log('Error Create Vlocity Temp Zip, Vlocity Temp not found');
        resolve();
      }
    } catch (e) {
      log.log(`Error Create Vlocity Temp Zip ${e}`);
      resolve();
    }
  });
}

function sendVlocityTemp(jsForceConnection, vlocityTempZip, snapshotId, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Send Vlocity Temp');

      const attachment = {
        Name: 'Vlocity Temp',
        ContentType: 'application/zip',
        Description: 'Vlocity Temp',
        ParentId: snapshotId,
        Body: vlocityTempZip
      };

      jsForceConnection.sobject('Attachment')
        .create(attachment)
        .then(() => {
          log.log('End Send Vlocity Temp');
          resolve();
        })
        .catch((e) => {
          log.log(`Error Send Vlocity Temp Zip ${e}`);
          reject(e);
        });
    } catch (e) {
      log.log(`Error Send Vlocity Temp Zip ${e}`);
      reject(e);
    }
  });
}

function completeDeployment(flosumUrl, flosumToken, projectName, jsForceConnection, logId, attachmentLogId, nameSpacePrefix, isSuccess, log, isError = false) {
  return new Promise((resolve, reject) => {
    try {
      Promise.resolve()
        .then(() => createVlocityTempZip(projectName, log))
        .then((vlocityTempZip) => {
          if (vlocityTempZip) {
            return sendVlocityTemp(jsForceConnection, vlocityTempZip, logId, log);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => resolvePromise(storage.readFile(projectName, `${constants.VLOCITY_TEMP_CATALOG}/${constants.VLOCITY_JOB_INFO}`, log)))
        .then((jobsInfo) => resolvePromise(addDeploymentStatusAttachments(flosumUrl, flosumToken, nameSpacePrefix, logId, jobsInfo, log)))
        .then(() => http.updateAttachmentLog(projectName, jsForceConnection, attachmentLogId, log, isError, true))
        .then((isResultError) => resolvePromise(http.callUpdateLog(jsForceConnection, logId, nameSpacePrefix, isSuccess, log, isResultError)))
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  retrieveBranchComponents,
  deployData,
  backupData,
  addDeploymentStatusAttachments,
  resolvePromise,
  completeDeployment
};
