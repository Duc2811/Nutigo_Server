const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    saleManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isSale: {
        default: false,
        type: Boolean
    },
    salePrice: {
        default: 0,
        type: Number
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },

}, {
    timestamps: true
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
