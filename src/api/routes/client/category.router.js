const express = require('express');
const routes = express.Router();
const controller = require('../../controllers/client/category.controller');
const authorization = require('../../../middleware/user.middleware');

routes.get('/getAllCategory', controller.getAllCategory);

routes.post('/addCategory', authorization.Authorization, controller.addCategory);
routes.put('/updateCategory/:id', authorization.Authorization, controller.updateCategory);
routes.delete('/managerDeleteCategory/:id', authorization.Authorization, controller.managerDeleteCategory);
routes.delete('/adminDeleteCategory/:id', authorization.Authorization, controller.adminDeleteCategory);

routes.get('/getAllSubCategory/:id', controller.getSubCategoryById);
routes.post('/addSubCategory/:id', authorization.Authorization, controller.addSubCategory)
routes.put('/updateSubCategory/:id', authorization.Authorization, controller.updateSubCategory)
routes.delete('/managerDeleteSubCategory/:id', authorization.Authorization, controller.managerDeleteSubCategory)
routes.get("/subcategories/:categoryId", controller.getAllSubCategoriesByCategory);


module.exports = routes;
