const axios = require('axios');
const yaml = require('js-yaml');
const constants = require('../../constants');
const storage = require('../../services/storage');

function post(flosumUrl, flosumToken, nameSpacePrefix, body) {
  return new Promise((resolve, reject) => {
    try {
      const headers = {
        Authorization: `OAuth ${flosumToken}`,
        'Content-Type': 'application/json',
      };

      axios.post(flosumUrl, body, { headers }).then((response) => {
        resolve(response);
      }).catch((e) => {
        if (e && e.response && e.response.data) {
          if (typeof e.response.data !== 'string') {
            reject(JSON.stringify(e.response.data));
          } else {
            reject(e.response.data);
          }
        } else if (e.request) {
          reject(e.request);
        } else {
          reject(e.message);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function callUpdateInfo(flosumUrl, flosumToken, logId, nameSpacePrefix, attachmentLogId, logFile, isSuccess, log, isError = false) {
  return new Promise((resolve, reject) => {
    try {
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      try {
        const logs = yaml.load(logFile);
        if (logs.Errors) {
          isError = logs.Errors.length > 0;
        }
      } catch (e) {}
      log.log(`Start Update Log is Success = ${isSuccess}`);
      const resBody = {
        logId,
        attachmentLogId,
        isJobCompleted: true,
        status: 'Completed',
        isSuccess,
        isError,
        attachmentBody: `${logFile}Full Process:\n\n${log.logs.join('\n')}`,
      };
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;
      const body = { methodType: constants.METHOD_UPDATE_LOG, body: JSON.stringify(resBody) };
      post(url, flosumToken, nameSpacePrefix, body)
        .then((response) => {
          log.log(`End Update Log is Success = ${isSuccess}`);
          resolve(response);
        })
        .catch((error) => {
          log.log(`Error Update Log is Success = ${isSuccess}`);
          reject(error);
        });
    } catch (e) {
      reject(e);
    }
  });
}

function callUpdateAttachmentInfo(flosumUrl, flosumToken, nameSpacePrefix, attachmentLogId, logFile, log) {
  return new Promise((resolve, reject) => {
    try {
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      log.log('Start Update Log');
      const resBody = {
        attachmentLogId,
        attachmentBody: `Vlocity Log File:\n\n${logFile}\n\nFull Process:\n\n${log.logs.join('\n')}`,
      };
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;
      const body = { methodType: constants.METHOD_UPDATE_ATTACHMENT_LOG, body: JSON.stringify(resBody) };
      post(url, flosumToken, nameSpacePrefix, body)
        .then((response) => {
          log.log('End Update Log');
          resolve(response);
        })
        .catch((error) => {
          log.log('Error Update Log');
          reject(error);
        });
    } catch (e) {
      reject(e);
    }
  });
}

function callNextVlocityStep(flosumUrl, flosumToken, nameSpacePrefix, pipelineId, pipelineNumber, pipelineKey, isPass, branchId, log) {
  return new Promise((resolve, reject) => {
    try {
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      log.log('Start Next Vlocity Step');
      const resBody = {
        pipelineId,
        pipelineNumber,
        isPass,
        branchId,
        pipelineKey,
      };
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;
      const body = { methodType: constants.METHOD_NEXT_VLOCITY_STEP, body: JSON.stringify(resBody) };
      post(url, flosumToken, nameSpacePrefix, body)
        .then((response) => {
          log.log('End Next Vlocity Step');
          resolve(response);
        })
        .catch((error) => {
          log.log('Error Next Vlocity Step');
          reject(error);
        });
    } catch (e) {
      reject(e);
    }
  });
}

function callComponentList(flosumUrl, flosumToken, attachmentIdList, nameSpacePrefix, componentsCount, log, componentsWithAttachmentList = []) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Call Component List');
      const prefix = nameSpacePrefix ? `${nameSpacePrefix.replace('__', '')}/` : '';
      const url = `${flosumUrl}/services/apexrest/${prefix}unlocked-packages`;
      const body = { methodType: constants.METHOD_TYPE_GET_ATTACHMENTS, body: JSON.stringify(attachmentIdList) };
      post(url, flosumToken, nameSpacePrefix, body)
        .then((response) => {
          let { data } = response;
          data = JSON.parse(data);
          log.log(`Retrieved: ${Number.parseFloat((componentsWithAttachmentList.length / componentsCount) * 100).toFixed(2)}%`);
          componentsWithAttachmentList.push(...data.recordList);
          if (data.idList && data.idList.length) {
            callComponentList(flosumUrl, flosumToken, data.idList, nameSpacePrefix, componentsCount, log, componentsWithAttachmentList)
              .then((result) => resolve(result))
              .catch((e) => {
                log.log('Error Call Component List');
                reject(e);
              });
          } else {
            log.log('End Call Component List');
            resolve(componentsWithAttachmentList);
          }
        }).catch((error) => {
          log.log('Error Call Component List');
          reject(error);
        });
    } catch (error) {
      log.log('Error Call Component List');
      reject(error);
    }
  });
}

function getAttachmentBody(jsForceConnection, attachmentLogId, log, isJoin = true) {
  return new Promise((resolve) => {
    try {
      const bodyStream = jsForceConnection.sobject('Attachment')
        .record(attachmentLogId)
        .blob('Body');

      const bufferArray = [];

      bodyStream.on('data', (data, enc) => {
        bufferArray.push(data);
      });

      bodyStream.on('end', () => {
        if (isJoin) {
          resolve(bufferArray.join(''))
        } else {
          resolve(Buffer.concat(bufferArray));
        }
      });

      bodyStream.on('error', (e) => {
        log.log('Error Get Attachment Body ' + e);
        resolve('');
      });

    } catch (e) {
      log.log('Error Get Attachment Body ' + e);
      resolve('');
    }
  });
}

function getTime() {
  const date = new Date();
  const values = [date.getDate(), date.getMonth() + 1, date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds()];
  values.forEach((value) => value = value.toString().replace(/^([0-9])$/, '0$1'));
  return `${values[2]}-${values[1]}-${values[0]} ${values[3]}:${values[4]}:${values[5]}`;
}

function callUpdateAttachmentLog(jsForceConnection, attachmentLogId, logBody, log, isError) {
  return new Promise((resolve) => {
    try {
      log.log('Start Update Attachment Log');

      const body = `${logBody}\n${log.logs.join('\n')}`;
      log.logs = [];

      const attachment = {
        Id: attachmentLogId,
        Body: Buffer.from(body).toString('base64'),
        ContentType: 'text/plain'
      };

      jsForceConnection.sobject('Attachment')
        .update(attachment)
        .then(() => {
          log.log('End Update Attachment Log');
          resolve(isError);
        })
        .catch((e) => {
          log.log('Error Update Attachment Log ' + e);
          resolve(isError);
        });
    } catch (e) {
      log.log('Error Update Attachment Log ' + e);
      resolve(isError);
    }
  });
}


function updateAttachmentLog(projectName, jsForceConnection, attachmentLogId, log, isError, isLatest = false) {
  return new Promise((resolve) => {
    try {
      log.log('Start Update Attachment Log');
      Promise.resolve()
        .then(() => getAttachmentBody(jsForceConnection, attachmentLogId, log))
        .then((body) => {
          if (isLatest) {
            return storage.readLogFile(projectName, getTime(), log)
              .then((logFile) => {
                try {
                  const logs = yaml.load(logFile);
                  if (logs.Errors.length) {
                    isError = true;
                  }
                } catch (e) {
                  logFile = '';
                  isError = true;
                }
                const logBody = `${logFile}\n${body}`;
                return callUpdateAttachmentLog(jsForceConnection, attachmentLogId, logBody, log, isError)
              })
          } else {
            return callUpdateAttachmentLog(jsForceConnection, attachmentLogId, body, log, isError)
          }
        })
        .then(() => resolve(isError))
        .catch(() => resolve(isError));
    } catch (e) {
      log.log('Error Update Attachment Log ' + e);
      resolve(isError);
    }
  });
}

function callUpdateLog(jsForceConnection, logId, nameSpacePrefix, isSuccess, log, isError = false) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Update Metadata Log isError ' + isError + ' isSuccess ' + isSuccess);

      const status = isSuccess && !isError
        ? 'Completed'
        : isSuccess && isError
          ? 'Partial Completed'
          : 'Exception';

      const metadataLog = {
        Id: logId,
        [`${nameSpacePrefix}Status__c`]: status,
        [`${nameSpacePrefix}Is_Error__c`]: isError,
        [`${nameSpacePrefix}Succeed__c`]: isSuccess,
        [`${nameSpacePrefix}Job_Completed__c`]: true,
      };

      jsForceConnection.sobject(`${nameSpacePrefix}Metadata_Log__c`)
        .update(metadataLog)
        .then(() => {
          log.log('End Update Metadata Log');
          resolve(metadataLog[`${nameSpacePrefix}Is_Error__c`]);
        })
        .catch((error) => {
          log.log(`Error Update Metadata Log ${error}`);
          reject(error);
        });
    } catch (e) {
      log.log(`Error Update Metadata Log ${e}`);
      reject(e);
    }
  });
}

module.exports = {
  getTime,
  post,
  callUpdateInfo,
  callNextVlocityStep,
  callComponentList,
  updateAttachmentLog,
  getAttachmentBody,
  callUpdateAttachmentLog,
  callUpdateLog,
};
