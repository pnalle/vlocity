const storage = require('../../../services/storage');
const helper = require('./helper');
const http = require('../../../services/http');

function installVlocityInitial(body, log) {
  return new Promise((resolve, reject) => {

    console.log('--- body');
    console.log(body);

    const flosumUrl = body.flosumUrl;
    const flosumToken = body.flosumToken;

    const vlocityUrl = body.vlocityUrl;
    const vlocityToken = body.vlocityToken;

    const logId = body.logId;
    const attachLogId = body.attachLogId;
    const timestamp = body.timestamp;
    const nameSpacePrefix = body.nameSpacePrefix;
    const snapshotType = body.snapshotType;

    const projectName = `${snapshotType}_${timestamp}_${attachLogId}`;

    // is pipeline
    const branchId = body.branchId;
    const pipelineId = body.pipelineId;
    const pipelineNumber = body.pipelineNumber;
    const pipelineKey = body.pipelineKey;

    storage.createProjectDirectory(projectName)
      .then(() => helper.runInstallVlocityInitialCommand(projectName, vlocityUrl, vlocityToken, log))
      .then(() => http.callUpdateInfo(flosumUrl, flosumToken, logId, nameSpacePrefix, attachLogId,
        `Completed Date: ${helper.getTime()}\n`, true, log))
      .then(() => storage.removeProject(projectName, log))
      .then(() => {
        if (pipelineId && pipelineNumber) {
          return http.callNextVlocityStep(flosumUrl, flosumToken, nameSpacePrefix, pipelineId, pipelineNumber, pipelineKey, true, branchId, log);
        } else {
          return Promise.resolve();
        }
      })
      .catch((error) => {
          http.callUpdateInfo(flosumUrl, flosumToken, logId, nameSpacePrefix, attachLogId,
            `Completed Date: ${helper.getTime()}\n`, false, log, true)
          .then(() => {
            if (pipelineId && pipelineNumber) {
              return http.callNextVlocityStep(flosumUrl, flosumToken, nameSpacePrefix, pipelineId, pipelineNumber, pipelineKey, false, branchId, log);
            } else {
              return Promise.resolve();
            }
          })
          .then(() => reject(error))
          .catch((error1) => reject(`${error}\n${error1}`));
      })
      .then(() => storage.removeProject(projectName, log));
  });
}

module.exports = {
  installVlocityInitial
};
