const { Router } = require('express');
const logger = require('../../../services/logger');
const constants = require('../../../constants');
const controller = require('./controller');
const utils = require('../../../services/utils');

const router = new Router();

router.post('/', (req, res) => {
  const log = logger.createLog(`vlocity:dep-from-dep:${req.headers['x-request-id']}`);
  log.log(constants.START_DEPLOYMENT_FROM_DEPLOYMENT);

  const fields = utils.checkRequiredFields(req.body, constants.REQUIRED_FIELDS_DEPLOYMENT_FROM_DEPLOYMENT, constants.REQUIRED_OBJECT_FIELDS_DEPLOYMENT_FROM_DEPLOYMENT);
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
  controller.deployFromDeployment(req.body, log)
    .catch((error) => log.log(error));
  return res.status(200).send('The process of deploy from a deployment started.');
});

module.exports = router;
