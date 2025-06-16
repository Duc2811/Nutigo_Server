const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        required: true,
        type: String
    },
    price: {
        required: true,
        type: Number
    },
    image: {
        required: true,
        type: String
    },
    description: {
        required: true,
        type: String
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true
    },
    quantity: {
        required: true,
        type: Number
    },
    sold: {
        default: 0,
        type: Number
    },
    rating: {
        default: 0,
        type: Number
    },
    numReviews: {
        default: 0,
        type: Number
    },
    deleted: {
        default: false,
        type: Boolean
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
