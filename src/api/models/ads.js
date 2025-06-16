const mongoose = require('mongoose')

const AdsSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    inactive: {
        type: Boolean,
        default: false
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Ads', AdsSchema, 'ads')