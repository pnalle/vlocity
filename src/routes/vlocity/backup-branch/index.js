const { Router } = require('express');
const logger = require('../../../services/logger');
const constants = require('../../../constants');
const controller = require('./controller');
const utils = require('../../../services/utils');

const router = new Router();

router.post('/', (req, res) => {
  const log = logger.createLog(`vlocity:backup-branch:${req.headers['x-request-id']}`);
  log.log(constants.START_BACKUP_BRANCH);

  const fields = utils.checkRequiredFields(req.body, constants.REQUIRED_FIELDS_BACKUP);
  if (fields.length) {
    log.log(constants.REQUIRED_FIELDS_ERROR);
    const body = {
      status: constants.ERROR,
      error: {
        message: constants.REQUIRED_FIELDS_ERROR,
        missingFields: fields,
      },
    };
    log.log(body);
    return res.status(400).send(body);
  }
  controller.backupBranch(req.body, log)
    .catch((error) => log.log(error));
  return res.status(200).send('The process of retrieve started.');
});

module.exports = router;
