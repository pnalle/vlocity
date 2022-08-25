const helper = require('./helper');
const storage = require('../../../services/storage');
const http = require('../../../services/http')

function backupBranch(body, log) {
  return new Promise((resolve, reject) => {
    try {

      console.log(body);
      const flosumUrl = body.flosumUrl;
      const flosumToken = body.flosumToken;
      const vlocityUrl = body.vlocityUrl;
      const vlocityToken = body.vlocityToken;
      const logId = body.logId;
      const timestamp = body.timestamp;
      const nameSpacePrefix = body.nameSpacePrefix;
      const vlocityNameSpacePrefix = body.vlocityNameSpacePrefix;
      const componentsMap = JSON.parse(body.componentsMap);

      // is pipeline
      const pipelineId = body.pipelineId;
      const branchId = body.branchId;
      const pipelineNumber = body.pipelineNumber;
      const pipelineKey = body.pipelineKey;

      const projectName = `${body.snapshotType}_${timestamp}_${body.logId}`;
      // const projectName = `Retrieve`;

      Promise.resolve()
        .then(() => storage.createProjectDirectory(projectName))
        .then(() => helper.createJobFileRollback(projectName, componentsMap, vlocityNameSpacePrefix,log))
        .then(() => helper.retrieveData(projectName, vlocityUrl, vlocityToken, log))
        .then(() => storage.checkExistComponents(projectName, log))
        .then((isNeedDeploy) => {
          if (isNeedDeploy) {
            return helper.prepareDataForDeploy(projectName, log)
              .then((componentsZipBufferList) => helper.deployData(flosumUrl, flosumToken, nameSpacePrefix, logId, componentsZipBufferList, pipelineId, pipelineNumber, branchId, log));
          } else {
            return helper.handleNoComponents(flosumUrl, flosumToken, nameSpacePrefix, logId, pipelineId, pipelineNumber, branchId, log)
          }
        })
        .then(() => {
          if (pipelineId && pipelineKey && pipelineNumber) {
            return helper.callContinuePipelineVlocityDeploy(flosumUrl, flosumToken, nameSpacePrefix, pipelineId, pipelineNumber, pipelineKey, branchId, logId, log);
          } else {
            return Promise.resolve();
          }
        })
        .catch((e) => {
          http.callUpdateInfo(flosumUrl, flosumToken, logId, nameSpacePrefix, attachLogId,
            `Completed Date: ${helper.getTime()}\n`, false, log, true)
          reject(e)
        })
        .then(() => storage.removeProject(projectName, log));
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  backupBranch
}
