const express = require('express');
const routes = express.Router();
const controller = require('../../controllers/client/order.controller');
const authorization = require('../../../middleware/user.middleware');


routes.get('/getAllOrder',controller.getAllOrders)
routes.get('/getOrderDetails/:id', controller.getOrderDetails)

routes.get('/getOrders', authorization.Authorization, controller.getOrders);
routes.get('/getOrdersDetails/:id', authorization.Authorization, controller.getOrdersDetails);
routes.post('/createOrder', authorization.Authorization, controller.createOrder);
routes.put('/updateOrderStatus/:id', authorization.Authorization, controller.updateOrderStatus);
routes.put('/updatePaymentStatus/:id', authorization.Authorization, controller.updatePaymentStatus);
routes.put('/userCancelOrder/:id', authorization.Authorization, controller.userCancelOrder);


routes.put('/transaction/:orderId', authorization.Authorization, controller.updateStatus);

module.exports = routes;