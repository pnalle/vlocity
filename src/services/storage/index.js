const fs = require('fs');
const AdmZip = require('adm-zip');
const constants = require('../../constants');

function createProjectDirectory(projectName) {
  return new Promise((resolve, reject) => {
    try {
      fs.mkdirSync(`./${projectName}`);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function removeProject(projectName, log) {
  return new Promise((resolve, reject) => {
    log.log('Start Remove Project');
    try {
      fs.rmdir(`./${projectName}`, { recursive: true }, (e) => {
        if (e) {
          log.log(`Error Remove Project${e}`);
          reject(e);
        }
        log.log('End Remove Project');
        resolve();
      });
    } catch (e) {
      log.log(`Error Remove Project${e}`);
      reject(e);
    }
  });
}

function removeFile(filePath, log) {
  return new Promise((resolve, reject) => {
    log.log('Start Remove File');
    try {
      fs.unlink(filePath, (e) => {
        if (e) {
          log.log(`Error Remove File${e}`);
          reject(e);
        }
        log.log('End Remove File');
        resolve();
      });
    } catch (e) {
      log.log(`Error Remove File${e}`);
      reject(e);
    }
  });
}

function checkExistComponents(projectName, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Check Exist Components');
      const pathSource = `./${projectName}/${constants.UNZIP_CATALOG_NAME}`;
      log.log('End Check Exist Components');
      resolve(fs.existsSync(pathSource));
    } catch (e) {
      log.log('Error Check Exist Components');
      reject(e);
    }
  });
}

function convertToBuffer(componentList, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Convert To Buffer');
      let b64ToBlobPromiseChain = Promise.resolve();
      componentList.forEach((comp) => {
        b64ToBlobPromiseChain = b64ToBlobPromiseChain
          .then(() => b64toBuffer(comp.body, log))
          .then((buffer) => {
            comp.body = buffer;
            return Promise.resolve();
          });
      });
      b64ToBlobPromiseChain
        .then(() => {
          log.log('End Convert To Buffer');
          resolve(componentList);
        }).catch((e) => {
          log.log(`Error Convert To Buffer\n${e}`);
          reject(e);
        });
    } catch (e) {
      log.log(`Error Convert To Buffer\n${e}`);
      reject(e);
    }
  });
}

function b64toBuffer(b64Data, log) {
  return new Promise((resolve, reject) => {
    try {
      const buf = Buffer.from(b64Data, 'base64');
      resolve(buf);
    } catch (e) {
      log.log(e);
      reject(e);
    }
  });
}

function unzipComponentList(bufferedComponentList, projectName, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Unzip Component List');
      let b64ToBlobPromiseChain = Promise.resolve();
      bufferedComponentList.forEach((comp) => {
        b64ToBlobPromiseChain = b64ToBlobPromiseChain
          .then(() => unzipBuffer(comp, projectName));
      });
      b64ToBlobPromiseChain
        .then(() => {
          log.log('End Unzip Component List');
          resolve();
        })
        .catch((e) => {
          log.log(`Error Unzip Component List ${e}`);
          reject(e);
        });
    } catch (e) {
      log.log(`Error Unzip Component List ${e}`);
      reject(e);
    }
  });
}

function unzipBuffer(comp, projectName) {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(comp.body);
      const projectDataPath = `${projectName}/${constants.UNZIP_CATALOG_NAME}`;
      zip.extractAllTo(projectDataPath, false);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function createApex(filePath, apexCode, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Create Apex File');
      fs.appendFileSync(filePath, apexCode);
      log.log('End Create Apex File');
      resolve();
    } catch (e) {
      log.log('Error Create Apex File ' + e);
      reject(e);
    }
  });
}

function createJobFileDeploy(projectName, fileContent, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Create Job File Deploy');
      fs.appendFileSync(`./${projectName}/${constants.JOB_FILE_NAME}`, fileContent);
      log.log('End Create Job File Deploy');
      resolve();
    } catch (e) {
      log.log('Error Create Job File Deploy ' + e);
      reject(e);
    }
  });
}

function readLogFile(projectName, time = null, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Read Log File');
      const path = `${projectName}/${constants.NAME_LOGS_FILE}`;
      if (fs.existsSync(path)) {
        let logFile = fs.readFileSync(path, { encoding: 'utf-8' });
        if (time) {
          logFile += `\nCompleted Date : ${time}`;
        }
        resolve(logFile);
        log.log('End Read Log File');
      } else {
        log.log('End Read Log File, Log file not found.');
        resolve('');
      }
    } catch (e) {
      log.log('Error Read Log File ' + e);
      reject(e);
    }
  });
}

function readFile(projectName, filePath, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Read File');
      const path = `${projectName}/${filePath}`;
      if (fs.existsSync(path)) {
        const file = fs.readFileSync(path, { encoding: 'utf-8' });
        resolve(file);
        log.log('End Read File');
      } else {
        log.log('End Read File, file not found.');
        resolve('');
      }
    } catch (e) {
      log.log('Error Log File');
      reject(e);
    }
  });
}

module.exports = {
  createApex,
  createProjectDirectory,
  removeProject,
  removeFile,
  createJobFileDeploy,
  readLogFile,
  readFile,
  checkExistComponents,
  convertToBuffer,
  unzipComponentList,
};
