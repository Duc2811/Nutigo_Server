const User = require('../../models/user')
const Order = require('../../models/order')
const SaleClaim = require('../../models/saleClaim')
const Feedback = require('../../models/feedback')
const PaginationHelper = require('../../../helper/pagination')
const Generate = require('../../../helper/generateRandom')
const bcrypt = require('bcryptjs');
const saltRounds = 10;

//[GET]/api/admin/getAllUser
module.exports.getAllUser = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        if (totalUsers === 0) {
            return res.status(404).json({ message: 'No users found.' });
        }
        const currentPage = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const paginationData = await PaginationHelper(
            {
                currentPage,
                limit
            },
            totalUsers,
            req.query
        );
        const users = await User.find()
            .skip(paginationData.skip)
            .limit(paginationData.limit)
            .sort({ createdAt: -1 });
        res.status(200).json({
            message: 'Users fetched successfully',
            users,
            totalPage: paginationData.totalPage,
            currentPage: paginationData.currentPage
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};


//[PUT]/api/admin/changeRole/:id
module.exports.changeRoleById = async (req, res) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const admin = await User.findOne({ token: token })
        if (!admin || admin.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to change role or User not found!!!' });
        }


        const { id } = req.params
        const { newRole } = req.body
        const validRoles = ['admin', 'user', 'productManager', 'sale'];
        if (!newRole || !validRoles.includes(newRole)) {
            return res.status(400).json({ message: `Invalid role! Allowed roles are: ${validRoles.join(', ')}` });
        }
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { role: newRole },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found!' });
        }

        res.status(200).json({
            code: 200,
            message: 'Role changed successfully!',
            user: updatedUser,
        });

    } catch (error) {
        res.status(500).json(error)
    }
}

//[PUT]/api/admin/changeStatus/:id
module.exports.changeStatus = async (req, res) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const admin = await User.findOne({ token: token })
        if (!admin || admin.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to change status or User not found!!!' });
        }
        const { id } = req.params
        const { status } = req.body
        const user = await User.findByIdAndUpdate(id, { status: status }, { new: true })
        await user.save()
        res.status(200).json({ code: 200, message: 'Status changed successfully', user })
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message })
    }
}

//[PUT]/api/admin/resetPassword/:id

module.exports.adminResetPassword = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const admin = await User.findOne({ token });
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized! Only admin can reset passwords.' });
        }

        const { id } = req.params;

        const newPassword = Generate.generateString(8);
        const salt = await bcrypt.genSalt(saltRounds);
        const bcryptPass = await bcrypt.hash(newPassword, salt);

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { password: bcryptPass },
            { new: true }
        );


        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found!' });
        }

        res.status(200).json({
            code: 200,
            message: 'Password reset successfully!',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error resetting password:', error.message);
        res.status(500).json({
            code: 500,
            message: error.message || 'Internal server error',
        });
    }
};


//[DELETE]/api/admin/deleteUser/:id
module.exports.deleteUser = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const admin = await User.findOne({ token });
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized! Only admin can delete users.' });
        }
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found!' });
        }
        res.status(200).json({
            code: 200,
            message: 'User deleted successfully!',
            user: deletedUser,
        });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({
            code: 500,
            message: error.message || 'Internal server error',
        });
    }
};

//[search]/api/admin/searchUser
module.exports.searchUser = async (req, res) => {
    try {
        const { search } = req.query;
        if (!search) {
            return res.status(400).json({
                code: 400,
                message: 'Search query is required!',
            });
        }
        // Tìm kiếm theo id (nếu `search` là ObjectId hợp lệ), username hoặc email
        const users = await User.find({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(search) ? search : null }, // Tìm theo ID nếu hợp lệ
                { username: { $regex: search, $options: 'i' } }, // Tìm kiếm theo username
                { email: { $regex: search, $options: 'i' } },   // Tìm kiếm theo email
            ],
        });

        res.status(200).json({
            code: 200,
            message: 'Users fetched successfully!',
            users,
        });
    } catch (error) {
        console.error('Error searching users:', error.message);
        res.status(500).json({
            code: 500,
            message: error.message || 'Internal server error',
        });
    }
};

module.exports.getAllOrder = async (req, res) => {
    try {
        const orders = await Order.find().populate("userId", "userName");

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found.' });
        }

        // Lấy tất cả SaleClaim
        const saleClaims = await SaleClaim.find();

        // Tạo map từ orderId đến salerId và assignedAt
        const orderToSalerMap = {};
        saleClaims.forEach((saleClaim) => {
            saleClaim.orderIds.forEach((orderId) => {
                orderToSalerMap[orderId.toString()] = {
                    salerId: saleClaim.salerId,
                    assignedAt: saleClaim.assignedAt,
                };
            });
        });

        // Gán thông tin saler cho từng order
        const ordersWithSaleClaims = orders.map((order) => {
            const saleClaim = orderToSalerMap[order._id.toString()];
            return {
                ...order.toObject(),
                saleClaim: saleClaim || null,
            };
        });

        res.status(200).json({
            message: 'Orders fetched successfully',
            orders: ordersWithSaleClaims,
        });
    } catch (error) {
        console.error('Detailed error fetching orders:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports.assignSalerToOrder = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const admin = await User.findOne({ token });
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized! Only admin can assign salers.' });
        }

        const { orderId, salerId } = req.body;

        if (!orderId || !salerId) {
            return res.status(400).json({ message: 'orderId and salerId are required!' });
        }

        const order = await Order.findById(orderId);
        const saler = await User.findById(salerId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found!' });
        }
        if (!saler || saler.role.toLowerCase() !== 'sale') {
            return res.status(404).json({ message: 'Saler not found or not a valid sale role!' });
        }

        // Tìm saler cũ (nếu có) đã được gán cho order này
        const oldSaleClaim = await SaleClaim.findOne({ orderIds: orderId });
        if (oldSaleClaim && oldSaleClaim.salerId.toString() !== salerId) {
            // Xóa orderId khỏi mảng orderIds của saler cũ
            await SaleClaim.updateOne(
                { salerId: oldSaleClaim.salerId },
                { $pull: { orderIds: orderId } }
            );
        }

        // Tìm hoặc tạo bản ghi SaleClaim cho salerId mới
        let saleClaim = await SaleClaim.findOne({ salerId });
        if (saleClaim) {
            // Nếu đã tồn tại, thêm orderId vào mảng orderIds nếu chưa có
            if (!saleClaim.orderIds.includes(orderId)) {
                saleClaim.orderIds.push(orderId);
                saleClaim.assignedAt = Date.now();
                await saleClaim.save();
            }
        } else {
            // Nếu chưa tồn tại, tạo mới với mảng orderIds chứa orderId
            saleClaim = new SaleClaim({
                salerId,
                orderIds: [orderId],
            });
            await saleClaim.save();
        }

        // Cập nhật trường saleClaim trong Order (nếu cần)
        order.saleClaim = { salerId }; // Đảm bảo Order cũng lưu salerId
        await order.save();

        res.status(200).json({
            code: 200,
            message: 'Saler assigned to order successfully!',
            saleClaim,
        });
    } catch (error) {
        console.error('Error assigning saler to order:', error.message);
        res.status(500).json({
            code: 500,
            message: error.message || 'Internal server error',
        });
    }
};

module.exports.getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate("productId", "name") // Lấy thông tin sản phẩm
            .populate("userId", "userName email") // Lấy thông tin người dùng
            .sort({ createdAt: -1 }); // Sắp xếp theo thời gian mới nhất

        res.status(200).json({ success: true, feedbacks });
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports.toggleFeedbackVisibility = async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm feedback theo ID
        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }

        // Đảo ngược trạng thái isHidden
        feedback.isHidden = !feedback.isHidden;
        await feedback.save();

        return res.status(200).json({
            success: true,
            message: `Feedback ${feedback.isHidden ? 'hidden' : 'shown'} successfully`,
            feedback
        });
    } catch (error) {
        console.error('Error toggling feedback visibility:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};