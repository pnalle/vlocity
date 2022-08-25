const jsForce = require('jsforce');
const fs = require('fs');
const helper = require('./helper');
const http = require('../../../services/http');
const storage = require('../../../services/storage');
const packRetry = require('../pack-retry/controller');
const constants = require('../../../constants');

function retrieve(body, log) {
  return new Promise(((resolve, reject) => {
    try {
      console.log('--- body');
      console.log(body);

      log.log(`Retrieval (SFI) started: ${http.getTime()}`);
      const timestamp = new Date().valueOf();

      const flosumUrl = body.authFlosum.instanceUrl;
      const flosumToken = body.authFlosum.accessToken;
      const vlocityUrl = body.authVlosityOrg.instanceUrl;
      const vlocityToken = body.authVlosityOrg.accessToken;
      const logId = body.logId;
      const attachLogId = body.attachLogId;
      const projectName = `${body.snapshotType}_${timestamp}_${body.logId}`;
      const authFlosum = body.authFlosum;
      const nameSpacePrefix = body.nameSpacePrefix;
      const vlocityNameSpacePrefix = body.vlocityNameSpacePrefix;
      const nameOfComponents = body.nameOfComponents;
      const searchBy = body.searchBy;
      const isLikeSearch = body.isLikeSearch;
      const snapshotId = body.snapshotId;
      const selectedDataPackTypes = JSON.parse(body.selectedDataPackTypes);
      const isNotIncludeDependencies = body.isNotIncludeDependencies;
      const isSeparateMatrixVersions = body.isSeparateMatrixVersions;
      const isSeparateCalculationProcedureVersions = body.isSeparateCalculationProcedureVersions;
      const isAfterUpdateSearchByKey = body.isAfterUpdateSearchByKey;
      const isRunPackRetryAutomatically = !!body.isRunPackRetryAutomatically;
      const restUrlFlosumGetAttachments = nameSpacePrefix === '' ? '/SnapshotVlocity/' : '/Flosum/SnapshotVlocity/';

      const jsForceConnection = new jsForce.Connection(authFlosum);
      Promise.resolve()
        .then(() => storage.createProjectDirectory(projectName))
        .then(() => helper.createJobYamlFile(
          projectName,
          vlocityUrl,
          vlocityToken,
          nameOfComponents,
          searchBy,
          isAfterUpdateSearchByKey,
          isLikeSearch,
          selectedDataPackTypes,
          vlocityNameSpacePrefix,
          log,
        ))
        .then(() => helper.retrieveData(
          projectName,
          vlocityUrl,
          vlocityToken,
          jsForceConnection,
          attachLogId,
          isNotIncludeDependencies,
          isSeparateMatrixVersions,
          isSeparateCalculationProcedureVersions,
          log,
        ))
        .then(() => storage.checkExistComponents(projectName, log))
        .then((isNeedDeploy) => {
          if (isNeedDeploy) {
            return helper.prepareDataForDeploy(projectName, snapshotId, log)
              .then((chunkIteratorDeploy) => helper.deployComponents(chunkIteratorDeploy, jsForceConnection, restUrlFlosumGetAttachments, log));
          }
          return Promise.resolve();
        })
        .then(() => {
          if (isRunPackRetryAutomatically) {
            return helper.checkErrors(projectName, log);
          } else {
            return Promise.resolve(false);
          }
        })
        .then((isHasErrors) => {
          if (isRunPackRetryAutomatically && isHasErrors) {
            log.log('Snapshot has errors, Start PackRetry command:');
            const body = {
              flosumUrl,
              flosumToken,
              vlocityUrl,
              vlocityToken,
              logId,
              attachLogId,
              timestamp,
              nameSpacePrefix,
              snapshotType: 'PackRetry',
              snapshotId,
              projectName,
            };
            if (fs.existsSync(`${projectName}/${constants.SOURCE_FOLDER}`)) {
              fs.rmdirSync(`${projectName}/${constants.SOURCE_FOLDER}`, { recursive: true });
            }
            return packRetry.packRetry(body, log);
          }
          return Promise.resolve();
        })
        .then(() => helper.completeDeployment(projectName, jsForceConnection, nameSpacePrefix, snapshotId, logId, attachLogId, true, log))
        .catch((error) => {
          helper.completeDeployment(projectName, jsForceConnection, nameSpacePrefix, snapshotId, logId, attachLogId, true, log, true)
            .then(() => reject(error))
            .catch((error1) => reject(`${error}\n${error1}`));
        })
        .then(() => storage.removeProject(projectName, log));
    } catch (e) {
      reject(e);
    }
  }));
}

module.exports = {
  retrieve,
};
