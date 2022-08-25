const jsForce = require('jsforce');
const storage = require('../../../services/storage');
const helper = require('./helper');
const http = require('../../../services/http');
const retrieveHelper = require('../retrieve/helper');

function packRetry(body, log) {
  return new Promise((resolve, reject) => {
    const bodyLog = JSON.parse(JSON.stringify(body));
    bodyLog.vlocityTempZip = 'zip';

    console.log('--- body');
    console.log(bodyLog);

    const flosumUrl = body.flosumUrl;
    const flosumToken = body.flosumToken;

    const vlocityUrl = body.vlocityUrl;
    const vlocityToken = body.vlocityToken;

    const logId = body.logId;
    const attachLogId = body.attachLogId;
    const timestamp = body.timestamp;
    const nameSpacePrefix = body.nameSpacePrefix;
    const snapshotType = body.snapshotType;
    const snapshotId = body.snapshotId;

    let isAfterCommand = false;
    let projectName;
    if (body.vlocityTempZip || body.vlocityTempAttachmentId) {
      projectName = `${snapshotType}_${timestamp}_${attachLogId}`;
    } else {
      isAfterCommand = true;
      projectName = body.projectName;
    }

    const jsForceConnection = new jsForce.Connection({ instanceUrl: flosumUrl, accessToken: flosumToken});

    Promise.resolve()
      .then(() => {
        let promise = Promise.resolve();
        if (!isAfterCommand) {
          promise = promise.then(() => storage.createProjectDirectory(projectName));
          if (body.vlocityTempZip) {
            promise = promise.then(() => helper.unzipVlocityTemp(projectName, body.vlocityTempZip, log));
          } else {
            promise = promise
              .then(() => http.getAttachmentBody(jsForceConnection, body.vlocityTempAttachmentId, log, false))
              .then((attachmentBody) => helper.unzipVlocityTemp(projectName, attachmentBody, log));
          }
        }
        return promise;
      })
      .then(() => helper.packRetry(projectName, vlocityUrl, vlocityToken, jsForceConnection, attachLogId, log))
      .then(() => helper.isNeedToDeploy(projectName, log))
      .then((isNeedDeploy) => {
        if (isNeedDeploy) {
          const jsForceConnection = new jsForce.Connection({ instanceUrl: flosumUrl, accessToken: flosumToken });
          const restUrlFlosumGetAttachments = nameSpacePrefix === '' ? '/SnapshotVlocity/' : '/Flosum/SnapshotVlocity/';
          return retrieveHelper.prepareDataForDeploy(projectName, snapshotId, log)
            .then((iteratorDeploy) => retrieveHelper.deployComponents(iteratorDeploy, jsForceConnection, restUrlFlosumGetAttachments, log));
        }
        return Promise.resolve();
      })
      .then(() => {
        if (isAfterCommand) {
          resolve();
        } else {
          return Promise.resolve()
            .then(() => retrieveHelper.completeDeployment(projectName, jsForceConnection, nameSpacePrefix, snapshotId, logId, attachLogId, true, log))
            .catch((error) => {
              retrieveHelper.completeDeployment(projectName, jsForceConnection, nameSpacePrefix, snapshotId, logId, attachLogId, true, log, true)
                .then(() => reject(error))
                .catch((error1) => reject(`${error}\n${error1}`));
            })
            .then(() => storage.removeProject(projectName, log));
        }
      });
  });
}

module.exports = {
  packRetry,
};
