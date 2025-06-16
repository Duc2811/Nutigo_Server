const Ads = require("../../models/ads");
const User = require('../../models/user')

module.exports.create = async (req, res) => {
    try {
        const { title, description, image, link, start, end } = req.body;
        const inactive = false;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const newAds = new Ads({ title, description, image, link, start, end, inactive, userId: user._id });
        await newAds.save();
        res.status(200).json({ message: "Create ads successfully", newAds });
    }
    catch (error) {
        res.status(500).json({ message: "Create ads failed", error });
    }
}

module.exports.update = async (req, res) => {
    try {
        const { adsId } = req.params;
        const { title, description, image, link, start, end } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const admin = await User.findOne({ token: token })
        if (!admin || admin.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to change role or User not found!!!' });
        }
        const ads = await Ads.findById(adsId);
        if (!ads) {
            return res.status(404).json({ message: 'Ads not found' });
        }

        ads.title = title;
        ads.description = description;
        ads.image = image;
        ads.link = link;
        ads.start = start;
        ads.end = end;
        await ads.save();
        res.status(200).json({ message: "Update ads successfully", ads });
    } catch (error) {
        res.status(500).json({ message: "Update ads failed", error });
    }
}

module.exports.delete = async (req, res) => {
    try {
        const { adsId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const admin = await User.findOne({ token: token })
        if (!admin || admin.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to change role or User not found!!!' });
        }
        const ads = await Ads.findByIdAndDelete(adsId);
        if (!ads) {
            return res.status(404).json({ message: 'Ads not found' });
        }

        res.status(200).json({ message: "Delete ads successfully", ads });
    } catch (error) {
        res.status(500).json({ message: "Delete ads failed", error });
    }
}

module.exports.getAll = async (req, res) => {
    try {
        const ads = await Ads.find();
        res.status(200).json({ message: "Get all ads successfully", ads });
    } catch (error) {
        res.status(500).json({ message: "Get all ads failed", error });
    }
}

module.exports.adsDetail = async (req, res) => {
    try {
        const { adsId } = req.params;
        const ads = await Ads.findById(adsId);
        if (!ads) {
            return res.status(404).json({ message: 'Ads not found' });
        }
        res.status(200).json({ message: "Get one ads successfully", ads });
    } catch (error) {
        res.status(500).json({ message: "Get one ads failed", error });
    }
}

module.exports.inactive = async (req, res) => {
    try {
        const { adsId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const admin = await User.findOne({ token: token })
        if (!admin || admin.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to change role or User not found!!!' });
        }
        const ads = await Ads.findById(adsId);
        if (!ads) {
            return res.status(404).json({ message: 'Ads not found' });
        }

        ads.inactive = !ads.inactive;
        await ads.save();
        res.status(200).json({ message: "Inactive ads successfully", ads });
    } catch (error) {
        res.status(500).json({ message: "Inactive ads failed", error });
    }
}

module.exports.ActiveAds = async (req, res) => {
    try {
        const ads = await Ads.find({ inactive: false });
        res.status(200).json({ message: "Get all ads successfully", ads });
    } catch (error) {
        res.status(500).json({ message: "Error:", error });
    }
}