const mongoose = require("mongoose");
const { Schema } = mongoose;

const saleClaimSchema = new Schema(
  {
    salerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },
    orderIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    }],
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SaleClaim", saleClaimSchema);