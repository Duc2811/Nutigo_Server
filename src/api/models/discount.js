const mongoose = require("mongoose");
const randomString = require('../../helper/generateRandom')
const { Schema } = mongoose;

const discountSchema = new Schema(
    {
        code: {
            default: randomString.generateString(20),
            type: String,
            unique: true,
            required: true,
        },
        discountType: {
            type: String,
            enum: ["Percentage", "Fixed"],
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
        },
        expirationDate: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        }, rate: {
            type: Number,
            required: true,
        },
        startAt: {
            type: Date,
            required: true,
            default: Date.now
        }, endAt: {
            type: Date,
            required: true,
        }

    }, {
    timestamps: true,
}
);

module.exports = mongoose.model("Discount", discountSchema);

