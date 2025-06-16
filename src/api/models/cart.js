const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartModel = new Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product: [
            {
                productId: {
                   type: mongoose.Types.ObjectId,
                   ref: "Product",
                   required: true
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
            },
        ],
        instance: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Cart", cartModel);