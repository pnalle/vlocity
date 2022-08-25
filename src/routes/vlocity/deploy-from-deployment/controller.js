const jsForce = require('jsforce');
const helper = require('./helper');
const http = require('../../../services/http');
const storage = require('../../../services/storage');
const constants = require('../../../constants');

function deployFromDeployment(body, log) {
  return new Promise(((resolve, reject) => {
    try {
      console.log('--- body');
      console.log(body);
      const flosumUrl = body.authFlosum.instanceUrl;
      const flosumToken = body.authFlosum.accessToken;
      const vlocityUrl = body.authVlosityOrg.instanceUrl;
      const vlocityToken = body.authVlosityOrg.accessToken;
      const logId = body.logId;
      const attachLogId = body.attachLogId;
      const timestamp = new Date().valueOf();
      const projectName = `${body.snapshotType}_${timestamp}_${body.logId}`;
      const authFlosum = body.authFlosum;
      const nameSpacePrefix = body.nameSpacePrefix;
      const deploymentId = body.deploymentId;
      const isSeparateMatrixVersions = body.isSeparateMatrixVersions;
      const isSeparateCalculationProcedureVersions = body.isSeparateCalculationProcedureVersions;
      const isEnabledApexPostDeploy = !!body.isEnabledApexPostDeploy;
      const apexCode = body.apexCode;

      const restUrlFlosumGetAttachments = nameSpacePrefix === '' ? '/GetVlocityComponents/' : '/Flosum/GetVlocityComponents/';
      let jobFileContent = `projectPath: ./${constants.UNZIP_CATALOG_NAME}`;
      const jsForceConnection = new jsForce.Connection(authFlosum);

      if (isEnabledApexPostDeploy) {
        jobFileContent += `\npostJobApex: apex${timestamp}.cls`;
      }

      const apexPath = `./${constants.VLOCITY_APEX_PATH}/apex${timestamp}.cls`;

      storage.createProjectDirectory(projectName)
        .then(() => isEnabledApexPostDeploy ? storage.createApex(apexPath, apexCode, log) : Promise.resolve())
        .then(() => storage.createJobFileDeploy(projectName, jobFileContent, log))
        .then(() => helper.retrieveSourceComponents(jsForceConnection, nameSpacePrefix, deploymentId, log))
        .then((componentIdList) => helper.retrieveVlocityAttachments(jsForceConnection, restUrlFlosumGetAttachments, componentIdList, log))
        .then((componentWithAttachmentList) => helper.unzipComponentList(componentWithAttachmentList, projectName, log))
        .then(() => helper.deployData(projectName, vlocityUrl, vlocityToken, isSeparateMatrixVersions, isSeparateCalculationProcedureVersions, isEnabledApexPostDeploy, `apex${timestamp}.cls`, log))
        .then(() => storage.readLogFile(projectName, helper.getTime(), log))
        .then((logFile) => http.callUpdateInfo(flosumUrl, flosumToken, logId, nameSpacePrefix, attachLogId, logFile, true, log))
        .catch((error) => {
          http.callUpdateInfo(flosumUrl, flosumToken, logId, nameSpacePrefix, attachLogId, `Error Date: ${helper.getTime()}\nError : ${error}`, false, log, true)
            .then(() => reject(error))
            .catch((error1) => reject(`${error}\n${error1}`));
        })
        .then(() => isEnabledApexPostDeploy ? storage.removeFile(apexPath, log) : Promise.resolve())
        .then(() => storage.removeProject(projectName, log));
    } catch (e) {
      reject(e);
    }
  }));
}

module.exports = {
  deployFromDeployment,
};
