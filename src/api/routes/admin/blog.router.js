const express = require('express');
const routes = express.Router();
const blogController = require('../../controllers/admin/blog.controller');
const authorization = require('../../../middleware/user.middleware');

// RESTful naming
routes.get('/', blogController.getAllBlogs);
routes.get('/:id', blogController.getBlogById);
routes.post('/', authorization.Authorization, blogController.addBlog);
routes.put('/:id', authorization.Authorization, blogController.updateBlog);
routes.delete('/:id', authorization.Authorization, blogController.deleteBlog);
routes.post('/:id/comment', authorization.Authorization, blogController.addComment);

module.exports = routes;