const Users = require('../api/models/user');

module.exports.Authorization = async (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.json({
        code: 401,
        message: "Unauthorized"
      });
    }
    try {
      const user = await Users.findOne({ token: token });
      if (!user) {
        return res.json({
          code: 401,
          message: "Invalid token"
        });
      }
      req.user = user; // Lưu thông tin user vào request
      next();
    } catch (error) {
      console.log(error);
      res.json({
        code: 403,
        message: "Forbidden"
      });
    }
};
  