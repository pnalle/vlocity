const fs = require('fs');
const crc32 = require('crc-32');
const AdmZip = require('adm-zip');
const yaml = require('js-yaml');
const { resolve } = require('path');
const constants = require('../../../constants');
const childProcess = require('../../../services/child-process');
const http = require('../../../services/http');
const storage = require('../../../services/storage');

function createJobYamlFile(
  projectName,
  vlocityUrl,
  vlocityToken,
  nameOfComponents,
  searchBy,
  isAfterUpdateSearchByKey,
  isLikeSearch,
  selectedDataPackTypesMap,
  vlocityNameSpacePrefix,
  log,
) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Create Job File');
      let jobFileBody = `projectPath: ./${constants.UNZIP_CATALOG_NAME}\n`;
      if (isAfterUpdateSearchByKey) {
        if (nameOfComponents) {
          if (searchBy === 'key') {
            const searchedComponentList = nameOfComponents.split('\n')
              .filter((key) => key.trim().startsWith('-'))
              .map((key) => key.replace('-', '').trim());
            if (searchedComponentList.length) {
              jobFileBody += 'manifest:\n - ';
              jobFileBody += searchedComponentList.join('\n - ');
              fs.appendFileSync(`./${projectName}/${constants.JOB_FILE_NAME}`, jobFileBody);
              log.log('End Create Job File');
              resolve();
            } else {
              reject('Error, Components not found');
            }
          } if (searchBy === 'yaml') {
            try {
              const yamlFile = yaml.load(nameOfComponents);
              yamlFile.projectPath = './source_data';
              fs.appendFileSync(`./${projectName}/${constants.JOB_FILE_NAME}`, yaml.dump(yamlFile));
              resolve();
              log.log('End Create Job File');
            } catch (e) {
              log.log(`Error Create Job File, Not Valid Provided Yaml File: ${e}`);
              reject(e);
            }
          } else {
            jobFileBody += `queries:\n${getVlocityQueries(nameOfComponents, isLikeSearch, selectedDataPackTypesMap, vlocityNameSpacePrefix)}`;
            fs.appendFileSync(`./${projectName}/${constants.JOB_FILE_NAME}`, jobFileBody);
            resolve();
            log.log('End Create Job File');
          }
        } else {
          jobFileBody += `queries:\n${getVlocityQueries(nameOfComponents, isLikeSearch, selectedDataPackTypesMap, vlocityNameSpacePrefix)}`;
          fs.appendFileSync(`./${projectName}/${constants.JOB_FILE_NAME}`, jobFileBody);
          resolve();
          log.log('End Create Job File');
        }
      } else {
        jobFileBody += `queries:\n${getVlocityQueries(nameOfComponents, isLikeSearch, selectedDataPackTypesMap, vlocityNameSpacePrefix)}`;
        fs.appendFileSync(`./${projectName}/${constants.JOB_FILE_NAME}`, jobFileBody);
        resolve();
        log.log('End Create Job File');
      }
    } catch (error) {
      log.log('Error Create Job File');
      reject(error);
    }
  });
}

function getVlocityQueries(nameOfComponents, isLikeSearch, selectedDataPackTypesMap, vlocityNameSpacePrefix) {
  const selectedDataPackTypeList = Array.isArray(selectedDataPackTypesMap) ? selectedDataPackTypesMap : Object.keys(selectedDataPackTypesMap);
  let queries = '';
  if (/^ *$/.test(nameOfComponents)) {
    nameOfComponents = [];
  } else {
    nameOfComponents = nameOfComponents.split(';');
  }
  if (nameOfComponents.length) {
    let nameOfComponentsStr = '';
    if (isLikeSearch) {
      nameOfComponentsStr = nameOfComponents.join('%\' OR Name LIKE \'%');
    } else {
      nameOfComponentsStr = nameOfComponents.join('\',\'');
    }
    selectedDataPackTypeList.forEach((type) => {
      queries += createQuery(type, vlocityNameSpacePrefix, nameOfComponentsStr, isLikeSearch);
    });
  } else {
    selectedDataPackTypeList.forEach((type) => {
      if (constants.UNSUPPORTED_BY_DEFAULT_LIST.includes(type)) {
        queries += createQuery(type, vlocityNameSpacePrefix);
      } else {
        queries += `- ${type}\n`;
      }
    });
  }
  return queries;
}

function createQuery(type, vlocityNameSpacePrefix, nameOfComponentsStr = null, isLikeSearch = false) {
  const objectData = constants.DATA_PACK_TYPES_QUERIES_MAP[type];
  let queries = '';
  if (objectData) {
    const objectApiName = (objectData.objectName.endsWith('__c') && !!vlocityNameSpacePrefix)
      ? `${vlocityNameSpacePrefix}${objectData.objectName}`
      : `${objectData.objectName}`;

    queries = `- VlocityDataPackType: ${type}\n`;

    const fields = objectData.fields.replace(new RegExp(constants.VLOCITY_NAMESPACE_PREFIX_CODE, 'g'), vlocityNameSpacePrefix);

    if (isLikeSearch) {
      queries += `  query: SELECT ${fields} FROM ${objectApiName}`;
      if (nameOfComponentsStr) {
        queries += ` WHERE Name LIKE '%${nameOfComponentsStr}%'`;
      }
    } else {
      queries += `  query: SELECT ${fields} FROM ${objectApiName}`;
      if (nameOfComponentsStr) {
        queries += ` WHERE Name IN ('${nameOfComponentsStr}')`;
      }
    }

    if (objectData.query) {
      const whereClause = nameOfComponentsStr ? 'AND' : 'WHERE';
      const objectQuery = objectData.query.replace(new RegExp(constants.VLOCITY_NAMESPACE_PREFIX_CODE, 'g'), vlocityNameSpacePrefix);
      queries += ` ${whereClause} ${objectQuery}\n`;
    } else {
      queries += '\n';
    }
  }
  return queries;
}

function retrieveData(projectName, vlocityUrl, vlocityToken, jsForceConnection, attachmentLogId, isNotIncludeDependencies, isSeparateMatrixVersions, isSeparateCalculationProcedureVersions, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Retrieve Data');
      const command = 'vlocity';
      const maxDepth = isNotIncludeDependencies ? '0' : '-1';
      const commandProperties = [
        '-sf.accessToken', `${vlocityToken}`,
        '-sf.instanceUrl', `${vlocityUrl}`,
        '-job', `${constants.JOB_FILE_NAME}`,
        '-autoRetryErrors',
        '-maxDepth', maxDepth,
      ];

      if (isSeparateMatrixVersions) {
        commandProperties.push('-separateMatrixVersions');
      }

      if (isSeparateCalculationProcedureVersions) {
        commandProperties.push('-separateCalculationProcedureVersions');
      }

      commandProperties.push('packExport');

      function callUpdate() {
        http.updateAttachmentLog(projectName, jsForceConnection, attachmentLogId, log, false)
      }

      // log.log(commandProperties.slice(2).join(' '));
      log.log(commandProperties.join(' '));

      const options = { cwd: `./${projectName}`, maxBuffer: 1024 * 500 };
      // const options = { cwd: `D:/Work/Flosum/Vlocity/Dev/Vlocity npm dev/${projectName}`, maxBuffer: 1024 * 500, shell: true };
      childProcess.callChildProcess(command, commandProperties, log, options, true, callUpdate)
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

function getAllAvailableExportsKeys(projectName, vlocityUrl, vlocityToken, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Get All Available Exports Keys');

      const command = 'vlocity';
      const commandProperties = [
        '-sf.accessToken', `${vlocityToken}`,
        '-sf.instanceUrl', `${vlocityUrl}`,
        '-nojob',
        'packGetAllAvailableExports',
      ];
      log.log(commandProperties.slice(2).join(' '));
      const options = { cwd: `./${projectName}`, maxBuffer: 1024 * 500 };
      childProcess.callChildProcess(command, commandProperties, null, options)
        .then((result) => {
          log.log('End Get All Available Exports Keys');
          resolve(result);
        })
        .catch((error) => {
          log.log(`Error Get All Available Exports Keys ${error}`);
          reject(error);
        });
    } catch (error) {
      log.log(`Error Get All Available Exports Keys ${error}`);
      reject(error);
    }
  });
}

function prepareDataForDeploy(projectName, snapshotId, log) {
  return new Promise(((resolve, reject) => {
    try {
      log.log('Start Prepare Data For Deploy');
      let heapSize = 0;
      let componentChunkList = [];
      let componentCount = 0;
      const chunkList = [];
      const pathSource = `./${projectName}/${constants.UNZIP_CATALOG_NAME}`;
      const componentTypeList = fs.readdirSync(pathSource);
      for (let i = 0; i < componentTypeList.length; i++) {
        const componentNameField = componentTypeList[i] === 'ContentVersion' ? 'Title' : 'Name';
        const componentPathList = `${pathSource}/${componentTypeList[i]}`;
        const componentNameList = fs.readdirSync(componentPathList);
        for (let e = 0; e < componentNameList.length; e++) {
          const label = `${componentTypeList[i]}/${componentNameList[e]}`;
          let fileName = componentNameList[e];
          const subItemList = [];
          const pathSubItems = `${pathSource}/${componentTypeList[i]}/${componentNameList[e]}`;
          const subItemNames = fs.readdirSync(pathSubItems);
          subItemNames.forEach((file) => {
            try {
              if (file.toString().endsWith('_DataPack.json')) {
                fileName = JSON.parse(fs.readFileSync(`${pathSubItems}/${file}`).toString())[componentNameField];
              }
            } catch (e) {
              log.log(`Error parse component ${file}`);
            }

            if (!fileName) {
              fileName = undefined;
            }
            if (fs.lstatSync(`${pathSubItems}/${file.toString()}`).isDirectory()) {
              subItemList.push(...findSubItems(pathSubItems, file));
            }
          });

          const zip = new AdmZip();
          zip.addLocalFolder(pathSubItems, `${componentTypeList[i]}/${componentNameList[e]}`);
          const bufferZip = zip.toBuffer();
          const crc = crc32.buf(bufferZip);
          const base64 = bufferZip.toString('base64');

          const dataItem = {
            fileName,
            name: componentNameList[e],
            type: componentTypeList[i],
            label,
            crc,
            base64,
            snapshotId,
            subItemList: JSON.stringify(subItemList),
          };
          const dataSize = bufferZip.length / 1e+6;
          const isLast = !!(componentNameList.length - 1 === e && componentTypeList.length - 1 === i);
          heapSize += dataSize;
          if (heapSize > 2 || componentChunkList > 4000) {
            chunkList.push(componentChunkList);
            if (dataSize < 3) {
              componentChunkList = [dataItem];
              componentCount++;
              heapSize = dataSize;
            } else {
              log.log(`Cannot retrieve component ${label}, size more then 3mb.`, true);
              heapSize = 0;
            }
          } else {
            componentChunkList.push(dataItem);
            componentCount++;
          }

          if (isLast) {
            chunkList.push(componentChunkList);
          }
        }
      }
      log.log('End Prepare Data For Deploy');
      resolve({ iteratorDeploy: chunkList[Symbol.iterator](), count: componentCount });
    } catch (error) {
      log.log('Error Prepare Data For Deploy');
      reject(error);
    }
  }));
}

function findSubItems(pathSubItems, file, filePath = '', subItemList = []) {
  if (filePath.length) {
    filePath = `/${filePath}`;
  }
  const subItems = fs.readdirSync(`${pathSubItems}/${file}${filePath}`);
  subItems.forEach((subFile) => {
    if (!fs.lstatSync(`${pathSubItems}/${file}${filePath}/${subFile.toString()}`).isDirectory()) {
    // if (subFile.toString().endsWith(constants.END_VLOCITY_FILE)) {
      subItemList.push(`${file}${filePath}/${subFile.toString()}`);
    } else {
      findSubItems(pathSubItems, file, subFile, subItemList);
    }
  });
  return subItemList;
}

function createZip(path, label) {
  const zip = new AdmZip();
  const componentList = readFiles(path);
  componentList.forEach((component) => {
    if (Array.isArray(component)) {
      component.forEach((componentChild) => {
        const file = fs.readFileSync(`${path}/${componentChild}`, 'utf8');
        zip.addFile(`${label}/${componentChild}`, Buffer.from(file));
      });
    } else {
      const file = fs.readFileSync(`${path}/${component}`, 'utf8');
      zip.addFile(`${label}/${component}`, Buffer.from(file));
    }
  });
  return zip.toBuffer();
}

function readFiles(dir, parentDir = '', fileList = []) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  dirents.forEach((dirent) => {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      const parentPackage = parentDir.length
        ? `${parentDir}/${dirent.name}`
        : dirent.name;
      readFiles(res, parentPackage, fileList);
    } else {
      let result;
      if (parentDir.length) {
        result = `${parentDir}/${dirent.name}`;
      } else {
        result = dirent.name;
      }
      fileList.push(result);
    }
  });
  return fileList;
}

function deployComponents(chunkIteratorDeploy, jsForceConnection, flosumUrl, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Deploy Components');
      nextChunk(chunkIteratorDeploy, jsForceConnection, flosumUrl, log)
        .then(() => {
          log.log('End Deploy Components');
          resolve();
        })
        .catch((error) => {
          log.log('Error Deploy Components ' + error);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

function nextChunk(chunkIteratorDeploy, jsForceConnection, flosumUrl, log, deployedCount = 0) {
  return new Promise(((resolve, reject) => {
    try {
      const chunk = chunkIteratorDeploy.iteratorDeploy.next();
      if (chunk.done) {
        resolve();
      } else {
        deploy(chunkIteratorDeploy, chunk, jsForceConnection, flosumUrl, log, deployedCount)
          .then(() => resolve())
          .catch((error) => reject(error));
      }
    } catch (error) {
      reject(error);
    }
  }));
}

function deploy(chunkIteratorDeploy, chunk, jsForceConnection, flosumUrl, log, deployedCount = 0) {
  return new Promise((resolve, reject) => {
    try {
      const body = { items: chunk.value };
      jsForceConnection.apex.post(flosumUrl, body)
        .then(() => {
          deployedCount += chunk.value.length;
          log.log(`Deployed ${deployedCount} from ${chunkIteratorDeploy.count}`);
          return Promise.resolve();
        })
        .catch((error) => {
          log.log(`Error deploy chunk ${error}`)
          return Promise.resolve();
        })
        .then(() => nextChunk(chunkIteratorDeploy, jsForceConnection, flosumUrl, log, deployedCount))
        .then(resolve)
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

function createVlocityTempZip(projectName, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Create Vlocity Temp Zip');
      const vlocityTempPath = `${projectName}/${constants.VLOCITY_TEMP_CATALOG}`;
      if (fs.existsSync(vlocityTempPath)) {
        const vlocityTempLogPath = `${vlocityTempPath}/logs`;
        if (log.errors.length && fs.existsSync(vlocityTempLogPath)) {
          const logFileList = fs.readdirSync(vlocityTempLogPath);
          if (logFileList && logFileList.length) {
            const logFileName = logFileList[0];
            if (logFileName.includes('job-yaml-') && logFileName.includes('-Export.yaml')) {
              const flosumErrorsText = `FlosumErrors: ${JSON.stringify(log.errors)}`;
              fs.appendFileSync(`./${vlocityTempLogPath}/${logFileName}`, flosumErrorsText);
            }
          }
        }
        const zip = new AdmZip();
        zip.addLocalFolder(vlocityTempPath, constants.VLOCITY_TEMP_CATALOG);
        resolve(zip.toBuffer().toString('base64'));
        log.log('End Create Vlocity Temp Zip');
      } else {
        log.log('Error Create Vlocity Temp Zip, Vlocity Temp not found');
        resolve();
      }
    } catch (e) {
      log.log(`Error Create Vlocity Temp Zip ${e}`);
      resolve();
    }
  });
}

function sendVlocityTemp(jsForceConnection, vlocityTempZip, snapshotId, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Send Vlocity Temp');

      const attachment = {
        Name: 'Vlocity Temp',
        ContentType: 'application/zip',
        Description: 'Vlocity Temp',
        ParentId: snapshotId,
        Body: vlocityTempZip
      };

      jsForceConnection.sobject('Attachment')
        .create(attachment)
        .then(() => {
          log.log('End Send Vlocity Temp');
          resolve();
        })
        .catch((e) => {
          log.log(`Error Send Vlocity Temp Zip ${e}`);
          reject(e);
        });
    } catch (e) {
      log.log(`Error Send Vlocity Temp Zip ${e}`);
      reject(e);
    }
  });
}

function checkErrors(projectName, log) {
  return new Promise((resolve) => {
    try {
      if (fs.existsSync(`${projectName}/${constants.NAME_LOGS_FILE}`)) {
        const logs = yaml.load(fs.readFileSync(`${projectName}/${constants.NAME_LOGS_FILE}`, 'utf8'));
        if (logs.Errors && logs.Errors.length) {
          log.log(`Errors found, start pack retry command \n${logs.Errors.join('\n')}`);
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    } catch (e) {
      resolve(false);
    }
  });
}

function completeDeployment(projectName, jsForceConnection, nameSpacePrefix, snapshotId, logId, attachmentLogId, isSuccess, log, isError = false) {
  return new Promise((resolve, reject) => {
    try {
      Promise.resolve()
        .then(() => createVlocityTempZip(projectName, log))
        .then((vlocityTempZip) => {
          if (vlocityTempZip) {
            return sendVlocityTemp(jsForceConnection, vlocityTempZip, snapshotId, log);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => http.updateAttachmentLog(projectName, jsForceConnection, attachmentLogId, log, isError, true))
        .then((isResultError) => {
          isError = isResultError;
          return http.callUpdateLog(jsForceConnection, logId, nameSpacePrefix, isSuccess, log, isResultError);
        })
        .then(() => callUpdateSnapshot(projectName, jsForceConnection, snapshotId, nameSpacePrefix, isError, log))
    } catch (e) {
      reject(e);
    }
  });
}

function callUpdateSnapshot(projectName, jsForceConnection, snapshotId, nameSpacePrefix, isError, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Update Snapshot');
      const snapshot = {
        Id: snapshotId,
        [`${nameSpacePrefix}Is_Completed__c`]: true,
        [`${nameSpacePrefix}Is_Error__c`]: isError
      };
      jsForceConnection.sobject(`${nameSpacePrefix}Snapshot_Vlocity__c`)
        .update(snapshot)
        .then(() => {
          log.log('End Update Snapshot');
          resolve(snapshot[`${nameSpacePrefix}Is_Error__c`]);
        })
        .catch((error) => {
          log.log('Error Update Snapshot');
          reject(error);
        });
    } catch (e) {
      log.log('Error Update Snapshot');
      reject(e);
    }
  });
}

module.exports = {
  createJobYamlFile,
  getAllAvailableExportsKeys,
  retrieveData,
  prepareDataForDeploy,
  createVlocityTempZip,
  sendVlocityTemp,
  deployComponents,
  checkErrors,
  completeDeployment,
};
