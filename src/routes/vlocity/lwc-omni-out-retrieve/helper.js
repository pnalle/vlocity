const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const AdmZip = require('adm-zip');
const constants = require('../../../constants');
const http = require('../../../services/http');

function query(jsForce, query, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Query');
      jsForce.query(query, (e, result) => {
        if (e) {
          log.log('Error Query ' + e);
          reject(e);
        } else {
          log.log('End Query');
          resolve(result
            .records
            .filter((omniScript) => omniScript.vlocity_cmt__Type__c && omniScript.vlocity_cmt__SubType__c && omniScript.vlocity_cmt__Language__c)
            .map(({vlocity_cmt__Type__c, vlocity_cmt__SubType__c, vlocity_cmt__Language__c}) => {
              return `${vlocity_cmt__Type__c}${vlocity_cmt__SubType__c}${vlocity_cmt__Language__c}`;
            })
          )
        }
      });
    } catch (e) {
      reject(e);
      log.log('Error Query ' + e);
    }
  })
}

function fetchOmniOutContentList(jsForce, omniScriptNameList, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Fetch OmniOut Content List ');
      const omniScriptLwcList = [];
      let count = 1;
      let promiseChain = Promise.resolve();
      omniScriptNameList.forEach((omniScriptName) => {
        promiseChain = promiseChain
          .then(() => fetchOmniOutContent(jsForce, omniScriptName ))
          .then((resultOmniScriptLwc) => {
            if (resultOmniScriptLwc && resultOmniScriptLwc.compositeResponse && resultOmniScriptLwc.compositeResponse.length === 2) {
              if (resultOmniScriptLwc.compositeResponse[0].httpStatusCode === 200) {
                omniScriptLwcList.push({
                  lwcComponentList: resultOmniScriptLwc.compositeResponse[1].body.records,
                  name: resultOmniScriptLwc.compositeResponse[0].body.records[0].DeveloperName
                })
              }
            }
            log.log(`Process Fetch OmniOut Content, processed ${count++}, retrieved ${omniScriptLwcList.length}, all ${omniScriptNameList.length}`);
          });
      });

      promiseChain
        .then(() => {
          log.log('End Fetch OmniOut Content List ');
          resolve(omniScriptLwcList)
        })
        .catch((e) => {
          log.log('Error Fetch OmniOut Content List ' + e);
          reject(e);
        });
    } catch (e) {
      reject(e);
      log.log('Error Fetch OmniOut Content List ' + e);
    }
  });
}

function fetchOmniOutContent(jsForce, omniScriptName) {
  omniScriptName = omniScriptName
    .replace('-', '')
    .replace('vlocity_cmt__', '');

  const body = {
    allOrNone: true,
    compositeRequest: [
      {
        "method": "GET",
        "referenceId": "bundleInfo",
        "url": `/services/data/v48.0/tooling/query?q=SELECT+Id,DeveloperName,Description+FROM+LightningComponentBundle+WHERE+DeveloperName='${omniScriptName}'`
      },
      {
        "method": "GET",
        "referenceId": "bundleResources",
        "url": "/services/data/v48.0/tooling/query?q=SELECT+Id,FilePath,Format,Source+FROM+LightningComponentResource+WHERE+LightningComponentBundleId='@{bundleInfo.records[0].Id}'"
      }
    ]
  }

  const siteUrl = jsForce.instanceUrl;


  const request = {
    method: `POST`,
    url: `${siteUrl}/services/data/v50.0/tooling/composite`,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    },
  };

  return jsForce.request(request);
}

function createLwcFiles(projectPath, lwcList, snapshotId, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Create Lwc Files');
      let chunkList = [];
      let componentList = [];
      let size = 0;

      let zip = new AdmZip();
      lwcList.forEach((lwc) => {

        componentList.push({
          apiName: lwc.name,
          componentType: 'LightningComponentBundle',
          label: `lwc/${lwc.name}`
        });

        lwc.lwcComponentList.forEach((lwcFile) => {
          if (lwcFile.Source !== '(hidden)') {
            size += lwcFile.Source.length;

            if (size < constants.MAX_SIZE_UNZIP_ATTACHMENT) {
              zip.addFile(`${lwcFile.FilePath}`, Buffer.from(lwcFile.Source.replace(new RegExp('vlocity_cmt', 'g'), 'c')));
            } else {
              chunkList.push({
                snapshotId,
                typeList: [{
                  type: 'LightningComponentBundle',
                  zip: zip.toBuffer().toString('base64'),
                  componentList
                }]
              });
              componentList = [];
              size = 0;
              zip = new AdmZip();
            }
          }
        });
        delete lwc.lwcComponentList;
      });

      if (componentList.length) {
        chunkList.push({
          snapshotId,
          typeList: [{
            type: 'LightningComponentBundle',
            zip: zip.toBuffer().toString('base64'),
            componentList
          }]
        });
      }

      log.log('End Create Lwc Files');
      resolve(chunkList);
    } catch (e) {
      log.log('Error Create Lwc Files ' + e);
      reject(e);
    }
  });
}

function sendComponents(flosumUrl, flosumToken, namespacePrefix, chunkList, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Send Components');
      let promiseChain = Promise.resolve();
      chunkList.forEach((chunk) => {
        promiseChain = promiseChain.then(() => callSentComponents(flosumUrl, flosumToken, namespacePrefix, chunk));
      });

      promiseChain.then(() => {
        log.log(`End Send Components`);
        resolve();
      })
        .catch((e) => {
          log.log('Error Send Components ' + e);
          reject(e);
        });

    } catch (e) {
      log.log('Error Send Components ' + e);
      reject(e);
    }
  });
}

function callSentComponents(flosumUrl, flosumToken, namespacePrefix, chunk) {
  return new Promise((resolve, reject) => {
    try {
      const body = { methodType: constants.METHOD_TYPE_ADD_COMPONENTS_TO_SNAPSHOT, body: JSON.stringify(chunk) };
      namespacePrefix = namespacePrefix ? `${namespacePrefix.replace('__', '')}/` : '';
      const url = `${flosumUrl}/services/apexrest/${namespacePrefix.replace('__', '')}unlocked-packages`;
      http.post(url, flosumToken, namespacePrefix.replace('__', ''), JSON.stringify(body))
        .then(() => {
          resolve()
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

function completeDeployment(projectName, jsForceConnection, nameSpacePrefix, snapshotId, logId, attachmentLogId, isSuccess, log, isError = false) {
  return new Promise((resolve, reject) => {
    try {
      Promise.resolve()
        .then(() => updateAttachmentLog(projectName, jsForceConnection, attachmentLogId, log, isError, true))
        .then((isResultError) => {
          isError = isResultError;
          return http.callUpdateLog(jsForceConnection, logId, nameSpacePrefix, isSuccess, log, isResultError);
        })
        .then(() => callUpdateSnapshot(jsForceConnection, snapshotId, nameSpacePrefix, isError, log))
    } catch (e) {
      reject(e);
    }
  });
}

function updateAttachmentLog(projectName, jsForceConnection, attachmentLogId, log, isError, isLatest = false) {
  return new Promise((resolve) => {
    try {
      log.log('Start Update Attachment Log');
      Promise.resolve()
        .then(() => http.getAttachmentBody(jsForceConnection, attachmentLogId, log))
        .then((body) => {
          return http.callUpdateAttachmentLog(jsForceConnection, attachmentLogId, body, log, isError)
        })
        .then(() => resolve(isError))
        .catch(() => resolve(isError));
    } catch (e) {
      log.log('Error Update Attachment Log ' + e);
      resolve(isError);
    }
  });
}

function callUpdateSnapshot(jsForceConnection, snapshotId, nameSpacePrefix, isError, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Update Snapshot');
      const snapshot = {
        Id: snapshotId,
        [`${nameSpacePrefix}Is_Completed__c`]: true,
        [`${nameSpacePrefix}Is_Error__c`]: isError,
      };
      jsForceConnection.sobject(`${nameSpacePrefix}Snapshot__c`)
        .update(snapshot)
        .then(() => {
          log.log('End Update Snapshot');
          resolve();
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


function getDependencyList(jsForce, omniScriptList, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Get Dependency List ');
      const dependencyList = [];

      let promiseChain = Promise.resolve();
      omniScriptList.forEach((omniScript) => {
        promiseChain = promiseChain
          .then(() => getPrefilledJSON(jsForce, omniScript, log))
          .then((prefilled) => {
            dependencyList.push(prefilled);
            log.log(`Process Get Dependency, processed ${dependencyList.length} from ${omniScriptList.length}`);
          });
      });

      promiseChain
        .then(() => {
          log.log('End Get Dependency List ');
          resolve(dependencyList)
        })
        .catch((e) => {
          log.log('Error Get Dependency List ' + e);
          reject(e);
        });
    } catch (e) {
      log.log('Error Get Dependency List ' + e);
      reject(e);
    }
  });
}

function getPrefilledJSON(jsForce, omniScript, log) {
  return new Promise((resolve, reject) => {
    try {

      const body = {
        sClassName: 'Vlocity BuildJSONWithPrefill',
        sType: omniScript.vlocity_cmt__Type__c,
        sSubType: omniScript.vlocity_cmt__SubType__c,
        sLang: omniScript.vlocity_cmt__Language__c
      };

      jsForce.apex.post('/vlocity_cmt/v1/GenericInvoke/', body, (e, prefilledJson) => {
        if (e) {
          log.log('Error getPrefilledJSON ' + e);
          reject(e);
        } else {
          resolve(JSON.parse(prefilledJson));
        }
      });
    } catch (e) {
      reject(e);
      log.log('Error Get Prefilled JSON ' + e);
    }
  })
}

function extractLwcDependencies(prefilledList, log) {
  return new Promise( (resolve, reject) => {
    try {
      log.log('Start Extract LWC Dependencies');
      let lwcList = [];
      prefilledList.forEach((definition) => {
        if(definition['children'] && definition['children'].length > 0) {
          definition['children'].forEach(child => {
            if(child['children'] && child['children'].length > 0) {
              child['children'].forEach(child1 => {
                if(child1.eleArray[0].type === 'Custom Lightning Web Component') {
                  lwcList.push(child1.eleArray[0].propSetMap.lwcName)
                }
              });
            }
          });
        }

        // get all mappings in script configuration
        if(definition.propSetMap && definition.propSetMap.elementTypeToLwcTemplateMapping) {
          for (const [key, value] of Object.entries(definition.propSetMap.elementTypeToLwcTemplateMapping)) {
            lwcList.push(value);
          }
        }

        // get all lwc overrides
        if(definition['children'] && definition['children'].length > 0) {
          definition['children'].forEach(child => {
            if(child.propSetMap && child.propSetMap.lwcComponentOverride) {
              lwcList.push(child.propSetMap.lwcComponentOverride);
            }
            if(child['children'] && child['children'].length > 0) {
              child['children'].forEach(child1 => {
                if(child1.eleArray[0].propSetMap && child1.eleArray[0].propSetMap.lwcComponentOverride) {
                  lwcList.push(child1.eleArray[0].propSetMap.lwcComponentOverride)
                }
              });
            }
          });
        }
      });
      log.log('End Extract LWC Dependencies');
      resolve(lwcList);
    } catch(e) {
      log.log('Error Extract LWC Dependencies ' + e);
      reject(e);
    }
  });
}

module.exports = {
  query,
  getDependencyList,
  extractLwcDependencies,
  fetchOmniOutContentList,
  createLwcFiles,
  sendComponents,
  completeDeployment,
};
