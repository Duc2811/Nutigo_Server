const Blog = require('../../models/blog'); // Đường dẫn đến model Blog
const User = require('../../models/user'); // Đường dẫn đến model User
const PaginationHelper = require('../../../helper/pagination');

module.exports.getAllBlogs = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    if (totalBlogs === 0) {
      return res.status(404).json({ message: 'No blogs found.' });
    }

    const paginationData = await PaginationHelper(
      {
        currentPage: 1,
        limit: 10, // Giới hạn 10 bài blog mỗi trang
      },
      totalBlogs,
      req.query
    );

    const blogs = await Blog.find()
      .skip(paginationData.skip)
      .limit(paginationData.limit)
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất

    res.status(200).json({
      blogs,
      totalPage: paginationData.totalPage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs: ' + error.message });
  }
};

module.exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id)
      .populate('comments.author', 'username email');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    // Tăng lượt xem
    blog.views += 1;
    await blog.save();

    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog: ' + error.message });
  }
};

module.exports.addBlog = async (req, res) => {
  try {
    const { title, description, content, tags } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token is missing or invalid!' });
    }

    const user = await User.findOne({ token });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins are authorized to add blogs!' });
    }

    const newBlog = new Blog({
      title,
      description,
      content,
      tags,
    });

    await newBlog.save();
    res.status(201).json({ message: 'Blog created successfully.', blog: newBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog: ' + error.message });
  }
};

module.exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, tags } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token is missing or invalid!' });
    }

    const user = await User.findOne({ token });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins are authorized to update blogs!' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, description, content, tags },
      { new: true }
    );

    res.status(200).json({ message: 'Blog updated successfully.', blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog: ' + error.message });
  }
};

module.exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token is missing or invalid!' });
    }

    const user = await User.findOne({ token });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins are authorized to delete blogs!' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    await Blog.findByIdAndDelete(id);
    res.status(200).json({ message: 'Blog deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog: ' + error.message });
  }
};

module.exports.addComment = async (req, res) => {
  try {
    const { id } = req.params; // Blog ID
    const { text } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token is missing or invalid!' });
    }

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(403).json({ message: 'Invalid token or user not found!' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    const newComment = { author: user._id, text };
    blog.comments.push(newComment);
    await blog.save();

    res.status(201).json({ message: 'Comment added successfully.', comment: newComment });
  } catch (error) {
    console.error("Error in addComment:", error); // Debug
    res.status(500).json({ message: 'Error adding comment: ' + error.message });
  }
};