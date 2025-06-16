const Order = require('../../models/order');
const Product = require('../../models/product');
const User = require('../../models/user');
const pagination = require('../../../helper/pagination');
const Transaction = require('../../models/transaction');
const Sale = require('../../models/sale');


module.exports.createOrder = async (req, res) => {
    try {
        const { products, totalAmount, paymentMethod, address, phone, note } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        const order = new Order({
            userId: user._id,
            products: products,
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            address: address,
            phone: phone,
            note: note,
        });
        await order.save();
        res.status(200).json({ message: 'Order created successfully', order });
    } catch (error) {
        console.error('Error creating order:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found!' });
        }
        order.orderStatus = status;
        await order.save();
        res.status(200).json({ message: 'Order updated successfully', order });
    } catch (error) {
        console.error('Error updating order:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, paymentMethod } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found!' });
        }
        order.paymentMethod = paymentMethod;
        order.paymentStatus = paymentStatus;
        await order.save();
        res.status(200).json({ message: 'Order updated successfully', order });
    } catch (error) {
        console.error('Error updating order:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports.getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        const orders = await Order.find({ userId: user._id })
            .sort({ createdAt: -1 });

        const paginatedOrders = pagination(orders, page, limit);

        res.status(200).json({
            message: 'Orders fetched successfully',
            orders: paginatedOrders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports.getOrdersDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Token is missing or invalid!" });
        }

       
        const user = await User.findOne({ token: token });
        
        if (!user) {
            return res.status(401).json({ message: "User not found!" });
        }


        // Tìm đơn hàng
        const order = await Order.findById(id)
            .populate("products.productId") // ✅ Populate product details
            .populate("userId") // ✅ Populate user details
            .exec();

        if (!order) {
            return res.status(404).json({ message: "Order not found!" });
        }

        // Tìm giao dịch liên quan đến orderId
        const transaction = await Transaction.findOne({ orderId: order._id });

        res.status(200).json({ 
            message: "Order details fetched successfully", 
            order,
            transaction  // ✅ Thêm giao dịch vào response
        });
    } catch (error) {
        console.error("Error fetching order details:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.userCancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found!' });
        }
        order.orderStatus = "Cancelled";
        await order.save();
        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        console.error('Error cancelling order:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports.getAllOrders = async (req, res) => {
    try {
        const order = await Order.find().exec();
        res.status(200).json({ message: 'Orders fetched successfully', order });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'server error: ' + error });
    }
}


module.exports.getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id)
            .populate('products.productId')
            .populate('userId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Lấy giao dịch liên quan đến đơn hàng
        const transaction = await Transaction.findOne({ orderId: order._id });

        // Lấy thông tin giảm giá (nếu có)
        const saleData = await Sale.find({ productId: { $in: order.products.map(p => p.productId) } });

        res.status(200).json({
            message: 'Order details fetched successfully',
            order,
            transaction: transaction || null, // Nếu không có transaction thì trả về null
            saleData: saleData.length ? saleData : null // Nếu không có khuyến mãi thì trả về null
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports.updateStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        console.log('orderId:', orderId);

        const order = await Order.findOne({ _id: orderId, userId: user._id });
        if (order) {
            order.paymentStatus = "Completed";
            await order.save();
        } else {
            return res.status(404).json({ message: 'Order not found or not belonging to the user!' });
        }

        const transaction = await Transaction.findOne({ orderId: orderId, userId: user._id });
        if (transaction) {
            transaction.status = "Completed";
            await transaction.save();
        } else {
            return res.status(404).json({ message: 'Transaction not found for the given order!' });
        }

        return res.status(200).json({ message: 'Order and transaction status updated successfully!' });
        
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
