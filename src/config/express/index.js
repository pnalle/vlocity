const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const defaultRouter = require('../../routes/default-route');
const defaultRouterError = require('../../routes/default-route-error');
const vlocityRouters = require('../../routes/vlocity');

// Create Express server with pre-defined set of middleware
function configureExpress({ vlocity }) {
  const app = express();

  app.use(helmet());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '5mb' }));

  /**
     * Default route handler - provides initial request handling
     * with further request forwarding
     */
  app.use('/', defaultRouter);
  app.use(vlocity, vlocityRouters);
  app.use('/', defaultRouterError);

  return app;
}

module.exports = {
  configureExpress,
};
