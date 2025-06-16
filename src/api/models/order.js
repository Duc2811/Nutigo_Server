const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderModel = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
            }
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["Wallet", "COD", "Bank Transfer"],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Completed", "Failed"],
            default: "Pending",
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["Pending", "Processing", "Completed", "Cancelled"],
            default: "Pending",
        },
        note: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", orderModel);
