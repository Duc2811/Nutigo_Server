const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        image: {
            type: String
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', 
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('SubCategory', subCategorySchema);
