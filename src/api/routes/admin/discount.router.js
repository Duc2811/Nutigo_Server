const express = require('express');
const routes = express.Router();
const controller = require('../../controllers/admin/discount.controller');
const authorization = require('../../../middleware/user.middleware');

routes.get('/getAllDiscount', controller.getAllDiscount);
routes.get('/adminGetAllDiscount', controller.adminGetAllDiscount);
routes.get('/getDiscountById/:discountId', controller.getDiscountById);

routes.get('/getDiscountByUser', authorization.Authorization, controller.getDiscountByUser);
routes.post('/createDiscount', authorization.Authorization, controller.createDiscount);
routes.put('/updateDiscount/:discountId', authorization.Authorization, controller.updateDiscount);
routes.delete('/deleteDiscount/:discountId', authorization.Authorization, controller.deleteDiscount);
routes.put('/discountStatus/:discountId', authorization.Authorization, controller.toggleDiscountStatus);


routes.post('/assignDiscount/:discountId', authorization.Authorization, controller.assignDiscount);
routes.delete('/unassignDiscount/:discountId', authorization.Authorization, controller.unassignDiscount);

routes.get('/userDiscounts', authorization.Authorization, controller.getAllUserDiscount);

routes.get('/getRecentDiscounts', controller.getRecentDiscounts);

routes.post('/addWithdrawalNumber', authorization.Authorization, controller.addWithdrawalNumber);

routes.get('/getAllUseHaveDiscount', controller.getAllUserHaveDiscount);

routes.get("/getUserDiscountActivity", authorization.Authorization, controller.getUserDiscountActivity);
routes.get("/getActiveDiscountsOverview", controller.getActiveDiscountsOverview);
routes.post('/getDiscountUsageStats', controller.getDiscountUsageStats);
routes.get('/getExpiredDiscountsReport', controller.getExpiredDiscountsReport);
routes.get('/getDiscountTypeDistribution', controller.getDiscountTypeDistribution);

module.exports = routes;