const jsForce = require('jsforce');
const helper = require('./helper');
const http = require('../../../services/http');
const storage = require('../../../services/storage');
const constants = require('../../../constants');
const puppeteer = require('puppeteer');

function deployFromBranch(body, log) {
  return new Promise(((resolve, reject) => {
    try {
      console.log('--- body');
      console.log(body);

      log.log(`Deployment (SFI) started: ${http.getTime()}`);
      const flosumUrl = body.flosumUrl;
      const flosumToken = body.flosumToken;
      const branchId = body.branchId;
      const nameSpacePrefix = body.nameSpacePrefix;
      const vlocityUrl = body.vlocityUrl;
      const vlocityToken = body.vlocityToken;
      const logId = body.logId;
      const isSeparateMatrixVersions = body.isSeparateMatrixVersions;
      const isSeparateCalculationProcedureVersions = body.isSeparateCalculationProcedureVersions;
      const isLWCActivation = body.isLWCActivation;
      const componentsCount = body.componentsCount;
      const componentIdListJson = body.componentIdListJson;
      const attachLogId = body.attachLogId;
      const isEnabledApexPostDeploy = !!body.isEnabledApexPostDeploy;
      const apexCode = body.apexCode;
      const timestamp = body.timestamp;

      let jobFileContent = `projectPath: ./${constants.UNZIP_CATALOG_NAME}`;
      if (isEnabledApexPostDeploy) {
        jobFileContent += `\npostJobApex: apex${timestamp}.cls`;
      }
      if (!isLWCActivation) {
        jobFileContent += `\nignoreLWCActivationOS: true\nignoreLWCActivationCards: true`;
      }
      try {
        let executablePath = puppeteer.executablePath();
        if (executablePath) {
          jobFileContent = `${jobFileContent}\npuppeteerExecutablePath: ${executablePath}`;
        }
      } catch (e) {}

      const apexPath = `./${constants.VLOCITY_APEX_PATH}/apex${timestamp}.cls`;
      const projectName = `${body.snapshotType}_${timestamp}_${body.logId}`;

      const jsForceConnection = new jsForce.Connection({
        instanceUrl: flosumUrl,
        accessToken: flosumToken
      });

      Promise.resolve()
        .then(() => storage.createProjectDirectory(projectName))
        .then(() => (isEnabledApexPostDeploy ? storage.createApex(apexPath, apexCode, log) : Promise.resolve()))
        .then(() => helper.retrieveBranchComponents(flosumUrl, flosumToken, branchId, nameSpacePrefix, componentsCount, log, componentIdListJson))
        .then((componentList) => storage.convertToBuffer(componentList, log))
        .then((bufferedComponentList) => storage.unzipComponentList(bufferedComponentList, projectName, log))
        .then(() => helper.backupData(flosumUrl, flosumToken, nameSpacePrefix, logId, projectName, log))
        .then(() => storage.createJobFileDeploy(projectName, jobFileContent, log))
        .then(() => helper.deployData(
          projectName,
          jsForceConnection,
          attachLogId,
          vlocityUrl,
          vlocityToken,
          isSeparateMatrixVersions,
          isSeparateCalculationProcedureVersions,
          isEnabledApexPostDeploy,
          `apex${timestamp}.cls`,
          componentsCount < 1500,
          log,
        ))
        .then(() => helper.completeDeployment(flosumUrl, flosumToken, projectName, jsForceConnection, logId, attachLogId, nameSpacePrefix, true, log))
        .catch((error) => {
          helper.completeDeployment(flosumUrl, flosumToken, projectName, jsForceConnection, logId, attachLogId, nameSpacePrefix, false, log, true)
            .then(() => reject(error))
            .catch((error1) => reject(`${error}\n${error1}`));
        })
        .then(() => (isEnabledApexPostDeploy ? storage.removeFile(apexPath, log) : Promise.resolve()))
        .then(() => storage.removeProject(projectName, log));
    } catch (e) {
      reject(e);
    }
  }));
}

module.exports = {
  deployFromBranch,
};
