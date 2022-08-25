const childProcess = require('../../../services/child-process');
const constants = require('../../../constants');

function cleanOrgData(projectName, vlocityUrl, vlocityToken, log) {
  return new Promise((resolve, reject) => {
    try {
      log.log('Start Clean Org Data');
      const command = 'vlocity';
      const commandProperties = [
        '-sf.accessToken', `${vlocityToken}`,
        '-sf.instanceUrl', `${vlocityUrl}`,
        '--nojob',
        'cleanOrgData',
      ];

      log.log('Command:');
      log.log( `-sf.accessToken ##########`);
      log.log( `-sf.instanceUrl ${vlocityUrl}`);
      log.log( `-nojob`);
      log.log( `cleanOrgData`);

      const options = { cwd: `./${projectName}`, maxBuffer: 1024 * 500 };
      childProcess.callChildProcess(command, commandProperties, log, options)
        .then((result) => {
          log.log('End Clean Org Data');
          resolve(result);
        })
        .catch((error) => {
          log.log(`Error Clean Org Data ${error}`);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

function getTime() {
  const date = new Date();
  const values = [date.getDate(), date.getMonth() + 1, date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds()];
  values.forEach((value) => value = value.toString().replace(/^([0-9])$/, '0$1'));
  return `${values[2]}-${values[1]}-${values[0]} ${values[3]}:${values[4]}:${values[5]}`;
}

module.exports = {
  cleanOrgData,
  getTime
}
