const express = require('express')
const routes = express.Router()
const authorization = require('../../../middleware/user.middleware')

const controller = require('../../controllers/Sale/sale.controller')



routes.get('/getAllProductsWithSale', controller.getAllProductsWithSale)
routes.post('/addSalePrice', authorization.Authorization, controller.addSalePrice)
routes.put('/updateSalePrice/:saleId', authorization.Authorization, controller.updateSalePrice);
routes.delete('/deleteSale/:id', authorization.Authorization, controller.deleteSale)
routes.get('/productWithSaleID', controller.getAllProductsWithSaleID)
routes.get('/getProductWithSaleById/:id', controller.getProductWithSaleById);

routes.get("/getAssignedOrders", controller.getAssignedOrders);
routes.post("/acceptOrder", authorization.Authorization, controller.acceptOrder);
routes.post("/completeOrder", authorization.Authorization, controller.completeOrder);
routes.post("/cancelOrder", authorization.Authorization, controller.cancelOrder);

module.exports = routes