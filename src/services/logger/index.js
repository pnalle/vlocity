const debug = require('debug');

function createLog(namespace) {
  debug.enable('vlocity*');
  const log = debug(namespace);

  return {
    logs: [],
    errors: [],
    log(text, isError = false, isShow = true, isSave = true) {
      if (isShow) {
        log(text);
      }
      if (isSave) {
        if (!this.logs) {
          this.logs = [];
        }
        this.logs.push(text);
      }
      if (isError) {
        if (!this.errors) {
          this.errors = [];
        }
        this.errors.push(text);
      }
    },
  };
}

module.exports = {
  createLog,
};
