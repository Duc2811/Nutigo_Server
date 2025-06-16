const express = require('express')
const routes = express.Router()
const authorization = require('../../../middleware/user.middleware')

const controller = require('../../controllers/shipper/shiper')
routes.post("/acceptOrder", authorization.Authorization, controller.acceptOrder);
routes.post("/completeOrder", authorization.Authorization, controller.completeOrder);
routes.post("/cancelOrder", authorization.Authorization, controller.cancelOrder);

module.exports = routes;
