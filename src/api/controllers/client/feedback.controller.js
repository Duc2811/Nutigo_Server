const Feedback = require("../../models/feedback");
const User = require('../../models/user');
module.exports.addFeedback = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];


        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const userId = user._id;

        const newFeedback = await Feedback.create({ userId, productId, rating, comment });
        res.status(200).json({ success: true, feedback: newFeedback });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports.getFeedback = async (req, res) => {
    try {
        const { productId } = req.params;
        const feedback = await Feedback.find({
            productId: productId,
            isHidden: false // Thêm điều kiện để chỉ lấy feedback không bị ẩn
        })
            .populate('userId', 'userName');
        res.status(200).json({ success: true, feedback });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports.deleteFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found!' });
        }

        if (feedback.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this feedback!' });
        }

        await Feedback.findByIdAndDelete(feedbackId);
        res.status(200).json({ success: true, message: 'Feedback deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
