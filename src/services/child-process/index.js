const childProcess = require('child_process');

function callChildProcess(command, commandProperties, log, options = {}, isShowLogs = true, func = null) {
  return new Promise((resolve, reject) => {
    try {
      const deploy = childProcess.spawn(command, commandProperties, options);

      let interval;
      let funcInterval;
      if (func) {
        funcInterval = setInterval(() => {
          func();
        }, 180000);
      }

      if (!isShowLogs) {
        if (log) {
          log.log(' Due to the large number of components, the logs from the npm package \'Vloсity\' will not be displayed, as this may lead to the application crash.');
        }
        interval = setInterval(() => {
          if (log) {
            log.log('Vlocity process in progress.', false, true, false);
          }
        }, 5000);
      }

      deploy.stdout.on('data', (data) => {
        if (log && data) {
          log.log(data.toString ? data.toString() : `${data}`, false, isShowLogs, true);
        }
      });

      deploy.stderr.on('data', (data) => {
        if (log && data) {
          log.log(data.toString ? data.toString() : `${data}`, false, isShowLogs, true);
        }
      });
      deploy.on('close', (code) => {
        if (interval) {
          clearInterval(interval);
        }
        if (funcInterval) {
          clearInterval(funcInterval);
        }
        if (log) {
          log.log(`End Call Child Process. Job has completed with code : ${code}`);
        }
        setTimeout(() => {
          resolve();
        }, 1000);
      });

      deploy.on('error', (error) => {
        if (interval) {
          clearInterval(interval);
        }
        reject(error);
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  callChildProcess,
};
