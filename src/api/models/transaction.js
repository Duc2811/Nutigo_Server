const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionModel = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order", 
            required: true, 
        },
        amount: {
            type: Number,
            required: true, 
        },
        paymentMethod: {
            type: String,
            enum: ["Wallet", "COD", "Bank Transfer"],
            required: true, 
        },
        status: {
            type: String,
            enum: ["Pending", "Completed", "Failed", "Cancelled"],
            default: "Pending", 
        },
        transactionDate: {
            type: Date,
            default: Date.now, 
        },
        description: {
            type: String, 
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Transaction", transactionModel);
