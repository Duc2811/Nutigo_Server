const express = require('express');
const routes = express.Router();
const controller = require('../../controllers/admin/admin.controller');
const authorization = require('../../../middleware/user.middleware');

routes.get('/getAllUser', controller.getAllUser);
routes.post('/changeRole/:id', authorization.Authorization, controller.changeRoleById);
routes.put('/changeStatus/:id', authorization.Authorization, controller.changeStatus);
routes.delete('/delete/:id', authorization.Authorization, controller.deleteUser);
routes.put('/adminChangePass/:id', authorization.Authorization, controller.adminResetPassword)
routes.get('/getAllOrder', controller.getAllOrder)
routes.post('/assignSalerToOrder', authorization.Authorization, controller.assignSalerToOrder);
routes.get('/getAllFeedback', controller.getAllFeedback);
routes.put('/toggleFeedbackVisibility/:id', authorization.Authorization, controller.toggleFeedbackVisibility);

module.exports = routes;