const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
    },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
