const jsForce = require('jsforce');
const storage = require('../../../services/storage');
const helper = require('./helper');
const http = require('../../../services/http');
const constants = require('../../../constants');

function lwcOmniOut(body, log) {
  return new Promise((resolve, reject) => {
    try {
      console.log('--- body');
      console.log(body);

      const vlocityUrl = body.vlocityUrl;
      const vlocityToken = body.vlocityToken;
      const soqlWhereClause = body.soqlWhereClause;
      const snapshotType = body.snapshotType;
      const snapshotId = body.snapshotId;
      const nameSpacePrefix = body.nameSpacePrefix;
      const logId = body.logId;
      const flosumUrl = body.flosumUrl;
      const flosumToken = body.flosumToken;
      const attachLogId = body.attachLogId;
      const timestamp = new Date().getTime() + '';

      let query = constants.LWC_OMNI_OUT_QUERY;
      if (soqlWhereClause) {
        query += ` AND ${soqlWhereClause}`
      }

      const projectName = `${snapshotType}_${timestamp}`;

      const vlocityJsForce = new jsForce.Connection({ instanceUrl: vlocityUrl, accessToken: vlocityToken });
      const flosumJsForce = new jsForce.Connection({ instanceUrl: flosumUrl, accessToken: flosumToken });

      let omniScriptNameList = []

      Promise.resolve()
        .then(() => storage.createProjectDirectory(projectName))
        .then(() => helper.query(vlocityJsForce, query, log))
        .then((resultOmniScriptList) => {
          omniScriptNameList = resultOmniScriptList;
          return helper.getDependencyList(vlocityJsForce, omniScriptNameList, log)
        })
        .then((prefilledList) => helper.extractLwcDependencies(prefilledList, log))
        .then((dependencyOmniScriptNameList) => omniScriptNameList.push(...dependencyOmniScriptNameList))
        .then(() => helper.fetchOmniOutContentList(vlocityJsForce, omniScriptNameList, log))
        .then((lwcList) => helper.createLwcFiles(projectName, lwcList, snapshotId, log))
        .then((chunkList) => helper.sendComponents(flosumUrl, flosumToken, nameSpacePrefix, chunkList, log))
        .then(() => helper.completeDeployment(projectName, flosumJsForce, nameSpacePrefix, snapshotId, logId, attachLogId, true, log))
        .catch((e) => {
          helper.completeDeployment(projectName, flosumJsForce, nameSpacePrefix, snapshotId, logId, attachLogId, true, log, true)
            .then(() => reject(e))
            .catch((error1) => reject(`${e}\n${error1}`));
        })
        .then(() => storage.removeProject(projectName, log));

    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  lwcOmniOut,
};
