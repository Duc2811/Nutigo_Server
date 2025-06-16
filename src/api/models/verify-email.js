const mongoose = require('mongoose')
const verify = new mongoose.Schema({
    email: String,
    otp: String,
    "expireAt": {
        type: Date,
        expires: 180
    }

},
    {
        timestamps: true
    })

const ForgotPassword = mongoose.model('Verify-email', verify, 'verify-email')

module.exports = ForgotPassword