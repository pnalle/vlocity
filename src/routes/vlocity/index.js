const { Router } = require('express');

const routers = require('./routers');

const router = new Router();

router.use('/vlocity', routers);

module.exports = router;
