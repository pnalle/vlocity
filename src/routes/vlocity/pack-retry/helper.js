const AdmZip = require('adm-zip');
const fs = require('fs');
const yaml = require('js-yaml');
const jsForce = require('jsforce');
const childProcess = require('../../../services/child-process');
const constants = require('../../../constants');
const http = require('../../../services/http');

function unzipVlocityTemp(projectName, vlocityTempZip, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Unzip Vlocity Temp');
      const zip = new AdmZip(vlocityTempZip);
      zip.extractAllTo(projectName, false);
      resolve();
      log.log('End Unzip Vlocity Temp');
    } catch (e) {
      log.log(`Error Unzip Vlocity Temp ${e}`);
      reject(e);
    }
  });
}

function packRetry(projectName, vlocityUrl, vlocityToken, jsForceConnection, attachmentLogId, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Pack Retry');
      const command = 'vlocity';
      const commandProperties = [
        '-sf.accessToken', `${vlocityToken}`,
        '-sf.instanceUrl', `${vlocityUrl}`,
        '--nojob',
        'packRetry',
      ];

      log.log('Command:');
      log.log('-sf.accessToken ##########');
      log.log(`-sf.instanceUrl ${vlocityUrl}`);
      log.log('-nojob');
      log.log('packRetry');

      function callUpdate() {
        http.updateAttachmentLog(projectName, jsForceConnection, attachmentLogId, log, false)
      }

      const options = { cwd: `./${projectName}`, maxBuffer: 1024 * 500 };
      childProcess.callChildProcess(command, commandProperties, log, options, true, callUpdate)
        .then((result) => {
          log.log('End Pack Retry');
          resolve(result);
        })
        .catch((error) => {
          log.log(`Error Pack Retry ${error}`);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

function isNeedToDeploy(projectName, log) {
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(`${projectName}/${constants.SOURCE_FOLDER}`)) {
        log.log('Exist Components To Deploy');
        resolve(true);
      } else {
        log.log('No Components To Deploy');
        resolve(false);
      }
    } catch (e) {
      log.log(`Error Unzip Vlocity Temp ${e}`);
      reject(e);
    }
  });
}

function callUpdateSnapshot(projectName, accessToken, instanceUrl, snapshotId, nameSpacePrefix, log) {
  return new Promise((resolve, reject) => {
    try {
      const jsForceConnection = new jsForce.Connection({ accessToken, instanceUrl });
      log.log('Start Update Snapshot');
      const snapshot = {
        Id: snapshotId,
        [`${nameSpacePrefix}Is_Completed__c`]: true,
      };
      if (fs.existsSync(`${projectName}/${constants.NAME_LOGS_FILE}`)) {
        const logs = yaml.load(fs.readFileSync(`${projectName}/${constants.NAME_LOGS_FILE}`, 'utf8'));
        if (logs.Errors) {
          snapshot[`${nameSpacePrefix}Is_Error__c`] = logs.Errors.length > 0;
        }
      } else {
        snapshot[`${nameSpacePrefix}Is_Error__c`] = false;
      }
      jsForceConnection.sobject(`${nameSpacePrefix}Snapshot_Vlocity__c`)
        .update(snapshot)
        .then(() => {
          log.log('End Update Snapshot');
          resolve();
        })
        .catch((error) => {
          log.log('Error Update Snapshot');
          reject(error);
        });
    } catch (e) {
      log.log('Error Update Snapshot');
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
  unzipVlocityTemp,
  callUpdateSnapshot,
  packRetry,
  getTime,
  isNeedToDeploy,
};
