const mongoose = require('mongoose');
const randomString = require('../../helper/generateRandom')
const userSchema = new mongoose.Schema({
    email: String,
    userName: String,
    password: String,
    phone: String,
    address: String,
    avatar: {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVva9csN-zOiY2wG9CXNuAI1VRsFunaiD3nQ&s"
    },
    token: {
        default: randomString.generateString(20),
        type: String
    },
    status: {
        type: String,
        default: "Inactive"
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'productManager', 'sale', 'shipper'],
        default: 'user'
    },
    deletedAt: Date,
    googleId: { type: String, unique: true, sparse: true },
},
    {
        timestamps: true
    })

const Users = mongoose.model('Users', userSchema, 'users');

module.exports = Users;
