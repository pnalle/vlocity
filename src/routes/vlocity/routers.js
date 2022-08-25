const { Router } = require('express');

const routers = new Router();

routers.use('/install-vlocity-initial', require('./install-vlocity-initial'));
routers.use('/clean-org-data', require('./clean-org-data'));
routers.use('/pack-retry', require('./pack-retry'));
routers.use('/lwc-omni-out-retrieve', require('./lwc-omni-out-retrieve'));
routers.use('/retrieve', require('./retrieve'));
routers.use('/backup-branch', require('./backup-branch'));
routers.use('/rollback', require('./rollback'));
routers.use('/deploy-from-branch', require('./deploy-from-branch'));
routers.use('/deploy-from-deployment', require('./deploy-from-deployment'));

module.exports = routers;
