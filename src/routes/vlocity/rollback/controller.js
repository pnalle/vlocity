const helper = require('./helper');
const storage = require('../../../services/storage');
const http = require('../../../services/http');
const constants = require('../../../constants');

function rollbackBranch(body, log) {
  return new Promise((resolve, reject) => {
    try {

      console.log(body);
      const flosumUrl = body.flosumUrl;
      const flosumToken = body.flosumToken;
      const vlocityUrl = body.vlocityUrl;
      const vlocityToken = body.vlocityToken;
      const logId = body.logId;
      const attachLogId = body.attachLogId;
      const timestamp = body.timestamp;
      const nameSpacePrefix = body.nameSpacePrefix;
      const attachmentIdList = JSON.parse(body.attachmentIdList);
      const componentKeyListJson = body.componentKeyList;

      let componentKeyList = [];
      if (componentKeyListJson) {
        componentKeyList = JSON.parse(componentKeyListJson);
      }

      const projectName = `${body.snapshotType}_${timestamp}_${body.logId}`;

      const jobFileContent = `projectPath: ./${constants.UNZIP_CATALOG_NAME}`;

      Promise.resolve()
        .then(() => storage.createProjectDirectory(projectName))
        .then(() => storage.createJobFileDeploy(projectName, jobFileContent, log))
        .then(() => http.callComponentList(flosumUrl, flosumToken, attachmentIdList, nameSpacePrefix, attachmentIdList.length, log))
        .then((componentList) => storage.convertToBuffer(componentList, log))
        .then((bufferedComponentList) => storage.unzipComponentList(bufferedComponentList, projectName, log))
        .then(() => {
          if (componentKeyList.length) {
            return helper.filterBySelectedKeys(projectName, componentKeyList, log);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => helper.deployData(projectName, vlocityUrl, vlocityToken, log))
        .then((logFile) => http.callUpdateInfo(flosumUrl, flosumToken, logId, nameSpacePrefix, attachLogId, logFile, true, log))
        .catch((error) =>
          http.callUpdateInfo(flosumUrl, flosumToken, logId, nameSpacePrefix, attachLogId, `Error Date: ${helper.getTime()}\nError : ${error}`, false, log, true)
          .then(() => reject(error))
        )
        .then(() => storage.removeProject(projectName, log));
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  rollbackBranch
}
