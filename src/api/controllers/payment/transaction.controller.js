const Transaction = require("../../models/transaction");
const Order = require("../../models/order");
const User = require("../../models/user");

// Tạo giao dịch mới
module.exports.createTransaction = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ code: 401, message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const { orderId, amount, paymentMethod, paymentStatus, description } = req.body;
        const transaction = new Transaction({ userId: user._id, orderId, amount, paymentMethod, paymentStatus, description });
        await transaction.save();
        res.status(200).json({ code: 200, transaction });
    } catch (error) {
        res.status(400).json({ code: 400, error: error.message });
    }
};

// Lấy danh sách giao dịch
module.exports.getTransactionsByUserID = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const userId = user._id;
        const transactions = await Transaction.find({ userId })
            .populate("userId")
            .populate({ path: "orderId", model: "Order" })
            .exec();

        res.status(200).json({ code: 200, transactions });
    } catch (error) {
        res.status(500).json({ code: 500, error: error.message });
    }
};

module.exports.updateTransactionStatus = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const { transactionId } = req.params;
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found!' });
        }
        transaction.status = "Completed";
        await transaction.save();
        res.status(200).json({ code: 200, transaction });
    } catch (error) {
        res.status(500).json({ code: 500, error: error.message });
    }
}

