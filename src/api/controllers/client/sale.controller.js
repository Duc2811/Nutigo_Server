const Sale = require('../../models/sale')
const PaginationHelper = require('../../../helper/pagination')
const User = require('../../models/user')
const Product = require('../../models/product')

module.exports.getAllProductsWithSale = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({ deleted: false })
        if (totalProducts === 0) {
            return res.status(404).json({ message: 'No products found.' })
        }
        const paginationData = await PaginationHelper({
            currentPage: 1,
            limit: 12,
        },
            totalProducts,
            req.query
        )
        const products = await Product.find({ deleted: false })
            .populate('category', 'name description')
            .populate('sale', 'discount startDate endDate')
            .skip(paginationData.skip)
            .limit(paginationData.limit)
            .sort({ createdAt: -1 });
        res.status(200).json({
            products,
            totalPage: paginationData.totalPage
        })
    } catch (error) {
        res.status(500).json(error)
    }
}

module.exports.addSale = async (req, res) => {
    try {
        const isSale = true;
        const { salePrice, startDate, endDate, discountType, discountAmount, minPurchase, productId } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const sale = await User.findOne({ token: token });
        if (!sale || sale.role !== 'sale') {
            return res.status(401).json({ message: 'User not authorized to add sale or User not found!!!' });
        }

        const product = await Product.findOne({ _id: productId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const newSale = new Sale({
            isSale,
            salePrice,
            startDate,
            endDate,
            discountType,
            discountAmount,
            minPurchase,
            saleManager: sale._id
        })
        await newSale.save();
        res.status(200).json({ message: 'Sale created successfully.' })


    } catch (error) {
        res.status(500).json('Error creating new sale ' + error.message)
    }
}

module.exports.updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { salePrice, startDate, endDate, discountType, discountAmount, minPurchase } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const sale = await User.findOne({ token: token });
        if (!sale || sale.role !== 'sale') {
            return res.status(401).json({ message: 'User not authorized to update sale or User not found!!!' });
        }
    }
    catch (error) {
        res.status(500).json('Error updating sale ' + error.message)
    }
}

module.exports.deleteSale = async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const sale = await User.findOne({ token: token });
        if (!sale || sale.role !== 'sale') {
            return res.status(401).json({ message: 'User not authorized to delete sale or User not found!!!' });
        }
        const deletedSale = await Sale.findByIdAndDelete(id);
        if (!deletedSale) {
            return res.status(404).json({ message: 'Sale not found.' })
        }
        res.status(200).json({ message: 'Sale deleted successfully.' })
    }
    catch (error) {
        res.status(500).json('Error deleting sale ' + error.message)
    }
}

module.exports.adminDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSale = await Sale.findByIdAndDelete(id);
        if (!deletedSale) {
            return res.status(404).json({ message: 'Sale not found.' })
        }
        res.status(200).json({ message: 'Sale deleted successfully.' })
    }
    catch (error) {
        res.status(500).json('Error deleting sale ' + error.message)
    }
}