const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true,
        },
        balance: {
            type: Number,
            default: 0,
            min: 0, 
        },
        currency: {
            type: String,
            default: 'VND',
            enum: ['VND', 'USD', 'EUR'], 
        }
    },
    { timestamps: true } 
);

module.exports = mongoose.model('Wallet', walletSchema);
