const fs = require('fs');
const AdmZip = require('adm-zip');
const childProcess = require('../../../services/child-process');
const constants = require('../../../constants');
const http = require('../../../services/http');

function createJobFileRollback(projectName, componentsMap, vlocityNameSpacePrefix, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Create Job File');

      let jobFileContent = `projectPath: ./${constants.UNZIP_CATALOG_NAME}\nqueries:\n`;
      Object.keys(componentsMap).forEach((componentType) => {
        componentsMap[componentType].forEach((componentName) => {
          constants.DATA_PACK_TYPES_QUERIES_MAP[componentType].forEach((objectApiName) => {
            jobFileContent += `  - VlocityDataPackType: ${componentType}\n`;
            jobFileContent += `    query: Select Id from ${objectApiName} where Name LIKE '%${componentName}%'\n`;
          });
        });
      });

      fs.appendFileSync(`./${projectName}/${constants.JOB_FILE_NAME}`, jobFileContent);
      log.log('End Create Job File');
      resolve();
    } catch (error) {
      log.log('Error Create Job File');
      reject(error);
    }
  });
}

function retrieveData(projectName, vlocityUrl, vlocityToken, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Retrieve Data');
      const command = 'vlocity';
      const commandProperties = [
        '-sf.accessToken', `${vlocityToken}`,
        '-sf.instanceUrl', `${vlocityUrl}`,
        '-job', `${constants.JOB_FILE_NAME}`,
        '-autoRetryErrors',
        '-maxDepth', '0',
        'packExport'
      ];

      log.log(commandProperties.slice(2).join(' '));

      const options = { cwd: `./${projectName}`, maxBuffer: 1024 * 500 };
      childProcess.callChildProcess(command, commandProperties, log, options)
        .then((result) => {
          log.log('End Retrieve Data');
          resolve(result);
        })
        .catch((error) => {
          log.log(`Error Retrieve Data ${error}`);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

function prepareDataForDeploy(projectName, log) {
  return new Promise(((resolve, reject) => {
    try {
      log.log('Start Prepare Data For Deploy');
      const pathSource = `./${projectName}/${constants.SOURCE_FOLDER}`;
      let zip = new AdmZip();
      const dirents = fs.readdirSync(pathSource, { withFileTypes: true });
      const bufferArray = [];
      dirents.forEach((dirent) => {
        if (dirent.isDirectory()) {
          const bufferZip = zip.toBuffer().toString('base64');
          if (bufferZip.length > 2000000) {
            bufferArray.push(bufferZip);
            zip = new AdmZip();
          }
          zip.addLocalFolder(`${pathSource}/${dirent.name}`, dirent.name);
        }
      });
      bufferArray.push(zip.toBuffer().toString('base64'));
      log.log('End Prepare Data For Deploy');
      resolve(bufferArray);
    } catch (error) {
      log.log('Error Prepare Data For Deploy');
      reject(error);
    }
  }));
}

function deployData(flosumUrl, flosumToken, nameSpacePrefix, logId, componentsZipBufferList, pipelineId, pipelineNumber, branchId, log) {
  return new Promise(((resolve, reject) => {
    try {
      log.log('Start Deploy Data');
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      let resBody = {
        zipBuffer: '',
        pipelineId,
        logId,
        branchId,
        pipelineNumber
      };
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;

      let promiseChain = Promise.resolve();
      let count = 1;
      componentsZipBufferList.forEach((zipBuffer) => {
        resBody.zipBuffer = zipBuffer;
        resBody.isStartDeploy = count === componentsZipBufferList.length;
        const body = { methodType: constants.METHOD_BACKUP_LOG, body: JSON.stringify(resBody) };
        promiseChain = promiseChain
          .then(() => postDeploy(url, flosumToken, nameSpacePrefix, body));
        count++;
      });

      promiseChain
        .then(() => {
          log.log(`End Deploy Data`);
          resolve();
        })
        .catch((error) => {
          log.log(`Error Deploy Data`);
          reject(error);
        });
    } catch (error) {
      log.log('Error Deploy Data');
      reject(error);
    }
  }));
}

function handleNoComponents(flosumUrl, flosumToken, nameSpacePrefix, logId, pipelineId, pipelineNumber, branchId, log) {
  return new Promise(((resolve, reject) => {
    try {
      log.log('Start Update Log. No Components to Backup.');
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      let resBody = {
        message: 'Components not found!',
        pipelineId,
        logId,
        branchId,
        pipelineNumber,
        isStartDeploy: true
      };
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;

      const body = { methodType: constants.METHOD_BACKUP_LOG_ERROR, body: JSON.stringify(resBody) };

      postDeploy(url, flosumToken, nameSpacePrefix, body)
        .then(() => {
          log.log('End Update Log. No Components to Backup.');
          resolve();
        }).catch((error) => {
          reject(error);
          log.log('Error Update Log. No Components to Backup.\n');
        });
    } catch (error) {
      log.log('Error Update Log. No Components to Backup.');
      reject(error);
    }
  }));
}

function postDeploy(url, flosumToken, nameSpacePrefix, body) {
  return new Promise(((resolve, reject) => {
    try {
      http.post(url, flosumToken, nameSpacePrefix, body)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          console.log(error)
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  }));
}


function callContinuePipelineVlocityDeploy(flosumUrl, flosumToken, nameSpacePrefix, pipelineId, pipelineNumber, pipelineKey, branchId, logId, log) {
  return new Promise((resolve, reject) => {
    try {
      nameSpacePrefix = (nameSpacePrefix && nameSpacePrefix.length) ? `${nameSpacePrefix.replace('__', '')}/` : '';
      log.log(`Start Continue Vlocity Pipeline Deploy`);
      const resBody = {
        pipelineId,
        pipelineNumber,
        logId,
        branchId,
        pipelineKey
      };
      const url = `${flosumUrl}/services/apexrest/${nameSpacePrefix}unlocked-packages`;
      const body = { methodType: constants.METHOD_NEXT_VLOCITY_CONTINUE_DEPLOY_STEP, body: JSON.stringify(resBody) };
      http.post(url, flosumToken, nameSpacePrefix, body)
        .then((response) => {
          log.log(`End Continue Vlocity Pipeline Deploy`);
          resolve(response);
        })
        .catch((error) => {
          log.log(`Error Continue Vlocity Pipeline Deploy`);
          reject(error);
        });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  createJobFileRollback,
  retrieveData,
  prepareDataForDeploy,
  deployData,
  handleNoComponents,
  callContinuePipelineVlocityDeploy
}
