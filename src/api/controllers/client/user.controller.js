const Users = require("../../models/user")
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const generalOtp = require('../../../helper/generateRandom');
const sendEmail = require('../../../helper/sendEmail')
const VerifyEmail = require("../../models/verify-email");


// [POST] api/user/register
module.exports.register = async (req, res) => {
    try {
        const { userName, email, password, phone, address } = req.body;
        const salt = await bcrypt.genSalt(saltRounds);

        const emailExists = await Users.findOne({ email });

        if (emailExists) {
            return res.status(409).json({ code: 409, message: "Email already exists" });
        }
        else {
            const hashPassword = await bcrypt.hash(password, salt)
            const user = new Users({ email, userName, password: hashPassword, phone, address });
            await user.save();
            res.status(201).json({
                code: 201,
                message: "Register successfully",
                userId: user.id
            })

            const otp = generalOtp.generateOtp(6);
            const objVrtify = {
                email: email,
                otp: otp,
                "expireAt": Date.now()
            }
            if (!otp) {
                res.status(509).json({ code: 509, message: "Error generate otp" })
            }
            const vertifyEmail = new VerifyEmail(objVrtify);
            await vertifyEmail.save();
            const subject = "Your One-Time Password (OTP) for Verify Account ";
            const html = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        line-height: 1.6;
                                        color: #333;
                                        background-color: #f9f9f9;
                                        padding: 20px;
                                    }
                                    .email-container {
                                        max-width: 600px;
                                        margin: 0 auto;
                                        background: #ffffff;
                                        border: 1px solid #ddd;
                                        border-radius: 8px;
                                        overflow: hidden;
                                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                                    }
                                    .email-header {
                                        background: #4caf50;
                                        color: #ffffff;
                                        text-align: center;
                                        padding: 20px;
                                        font-size: 24px;
                                    }
                                    .email-body {
                                        padding: 20px;
                                        text-align: left;
                                    }
                                    .email-body h3 {
                                        color: #4caf50;
                                    }
                                    .email-footer {
                                        text-align: center;
                                        padding: 10px;
                                        background: #f1f1f1;
                                        color: #555;
                                        font-size: 12px;
                                    }
                                    .otp {
                                        font-size: 24px;
                                        font-weight: bold;
                                        color: #333;
                                        background: #f4f4f4;
                                        padding: 10px;
                                        border-radius: 8px;
                                        display: inline-block;
                                        margin: 10px 0;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="email-container">
                                    <div class="email-header">
                                        Account Verify email
                                    </div>
                                    <div class="email-body">
                                        <p>Dear User,</p>
                                        <p>To complete verify your process for your account, please use the following One-Time Password (OTP):</p>
                                        <h3 class="otp">${otp}</h3>
                                        <p>This OTP is valid for the next <strong>3 minutes</strong>. For your security, please do not share this OTP with anyone.</p>
                                        <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
                                        <p>Thank you,<br>The L-Shop Team</p>
                                    </div>
                                    <div class="email-footer">
                                        © 2025 L-Shop. All rights reserved.
                                    </div>
                                </div>
                            </body>
                            </html>
                            `;
            try {
                await sendEmail.sendEmail(email, subject, html)
                console.log('Email sent successfully');
            } catch (emailError) {
                console.log('Error sending email:', emailError);
            }
        }

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error ", error })
    }
}

// [POST] api/user/login
module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userInactive = await Users.findOne({
            email: email,
            status: "Inactive",
        })

        if (userInactive) {
            res.json({
                code: 606,
                message: "Your email has not been verified yet. Please check your email for the OTP and use it to verify your account."
            })
        }

        const user = await Users.findOne({
            email: email,
            status: "active",
        })

        if (!user) {
            res.json({
                code: 402,
                message: "The email address you entered does not exist."
            })
        } else {
            if (user.status !== "active") {
                res.json({
                    code: 402,
                    message: "Your account has been deactivated."
                })
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                res.json({
                    code: 402,
                    message: "The password not correct."
                })
            } else {
                res.cookie('token', user.token)
                res.json({
                    code: 200,
                    token: user.token,
                    id: user.id,
                    role: user.role,
                    message: "Login Successful."
                })
            }
        }

    } catch (error) {
        console.log("error" + error);
    }
}

module.exports.getUserID = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({
                code: 400,
                message: "Email is required"
            });
        }

        const user = await Users.findOne({ email: email });

        if (!user) {
            return res.status(404).json({
                code: 404,
                message: "User Not Found"
            });
        }

        const userId = user._id;
        res.json({
            code: 200,
            message: "User ID Found",
            userId: userId
        });
    } catch (error) {
        console.error("Error fetching user ID:", error);
        res.status(500).json({
            code: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};



//['POST']api/user/verify
module.exports.vertifyEmail = async (req, res) => {
    try {
        const { otp, email } = req.body;

        const optCorrect = await VerifyEmail.findOne({
            otp: otp
        })
        if (!optCorrect) {
            return res.status(400).json({ code: 400, message: "OTP Not Correct" })
        }


        const userData = await Users.findOne({
            email: email
        })
        const userId = userData._id

        await Users.updateOne({
            _id: userId
        }, {
            status: "active"
        })
        res.status(201).json({
            code: 201,
            message: "Vertify Successfully",
        })
    } catch (error) {
        res.status(500).json({ code: 500, message: "Internal Server Error: " + error })
    }
}

// [POST] api/forgot-password
module.exports.forgot = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Users.findOne({
            email: email,
            status: "active"
        })
        if (!user) {
            return res.status(401).json({
                message: "Email Not Exits"
            })
        }

        const otp = generalOtp.generateOtp(6);
        const objVrtify = {
            email: email,
            otp: otp,
            "expireAt": Date.now()
        }
        const vertifyEmail = new VerifyEmail(objVrtify);
        await vertifyEmail.save();
        const subject = "Your One-Time Password (OTP) for Account reset password";
        const html = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        line-height: 1.6;
                                        color: #333;
                                        background-color: #f9f9f9;
                                        padding: 20px;
                                    }
                                    .email-container {
                                        max-width: 600px;
                                        margin: 0 auto;
                                        background: #ffffff;
                                        border: 1px solid #ddd;
                                        border-radius: 8px;
                                        overflow: hidden;
                                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                                    }
                                    .email-header {
                                        background: #4caf50;
                                        color: #ffffff;
                                        text-align: center;
                                        padding: 20px;
                                        font-size: 24px;
                                    }
                                    .email-body {
                                        padding: 20px;
                                        text-align: left;
                                    }
                                    .email-body h3 {
                                        color: #4caf50;
                                    }
                                    .email-footer {
                                        text-align: center;
                                        padding: 10px;
                                        background: #f1f1f1;
                                        color: #555;
                                        font-size: 12px;
                                    }
                                    .otp {
                                        font-size: 24px;
                                        font-weight: bold;
                                        color: #333;
                                        background: #f4f4f4;
                                        padding: 10px;
                                        border-radius: 8px;
                                        display: inline-block;
                                        margin: 10px 0;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="email-container">
                                    <div class="email-header">
                                        Account Reset Password
                                    </div>
                                    <div class="email-body">
                                        <p>Dear User,</p>
                                        <p>To complete the reset password process for your account, please use the following One-Time Password (OTP):</p>
                                        <h3 class="otp">${otp}</h3>
                                        <p>This OTP is valid for the next <strong>3 minutes</strong>. For your security, please do not share this OTP with anyone.</p>
                                        <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
                                        <p>Thank you,<br>The L-Shop Team</p>
                                    </div>
                                    <div class="email-footer">
                                        © 2025 L-Shop. All rights reserved.
                                    </div>
                                </div>
                            </body>
                            </html>
                    `;
        sendEmail.sendEmail(email, subject, html)
        res.status(200).json({
            code: 200,
            message: "Send OTP Successfully",
            otp: otp
        })
    } catch (error) {
        res.status(500).json(error)
    }
}



// [POST] api/user/otp
module.exports.otp = async (req, res) => {
    try {
        const { otp, email } = req.body;


        const user = await Users.findOne({
            email: email
        })
        if (!user) {
            return res.status(401).json({ code: 401, message: "Email Not Correct" })
        }

        const otpExits = await VerifyEmail.findOne({
            email: email,
            otp: otp
        })
        if (!otpExits) {
            return res.status(400).json({ code: 400, message: "OTP Not Correct" })
        }

        res.status(200).json({
            code: 200,
            token: user.token,
            message: "OTP sended successfully"
        })
    } catch (error) {
        res.status(500).json(error)
    }
}

// [POST] api/user/reset-password
module.exports.reset = async (req, res) => {
    const token = req.body.token;
    const salt = await bcrypt.genSalt(saltRounds);
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
        return res.status(400).json({
            code: 400,
            message: "Password Not Match"
        })
    }
    else {
        const user = await Users.findOne({ token: token });
        if (!user) {
            res.status(401).json({
                code: 401,
                message: "User Not Found"
            })
        }
        const newPassword = await bcrypt.hash(password, salt);
        console.log(newPassword)
        await Users.updateOne({ token: token }, { password: newPassword })
        res.status(200).json({
            code: 200,
            message: "Reset Password Successfully"
        })
    }
}


// api/user/user-profile
module.exports.profile = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await Users.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        res.json({
            code: 200,
            user: user,
            message: "User Founded"
        })

    } catch (error) {
        console.log(error)
    }
}
// api/user/edit-profile
module.exports.editProfile = async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.split(' ')[1];
        const { userName, phone, address } = req.body;

        if (token) {
            const user = await Users.findOneAndUpdate({
                token: token
            }, {
                userName: userName,
                phone: phone,
                address: address
            })
            res.json({
                code: 200,
                message: "Update Successfull.",
                user: user
            })
        }
    } catch (error) {
        console.log(error)
    }
}


module.exports.getAllUser = async (req, res) => {
    try {
        const users = await Users.find({})
        res.json({
            code: 200,
            users: users
        })
    } catch (error) {
        console.log(error)
    }
}


// api/user/change-password
module.exports.changePassword = async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.split(' ')[1];
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!token) {
            return res.status(401).json({ code: 401, message: 'Unauthorized! Token is missing' });
        }

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ code: 400, message: 'All fields are required!' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ code: 400, message: 'New password and confirm password do not match!' });
        }

        const user = await Users.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ code: 404, message: 'User not found!' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ code: 400, message: 'Old password is incorrect!' });
        }

        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await Users.updateOne({ token: token }, { password: hashedPassword });

        res.status(200).json({ code: 200, message: 'Password changed successfully!' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ code: 500, message: 'Internal Server Error', error });
    }
};

// [POST] api/user/upload-avatar
module.exports.uploadAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;
        console.log("avatar", avatar)
        // Kiểm tra định dạng ảnh (phải là Base64 hoặc URL)
        if (!avatar.startsWith("data:image/") && !avatar.startsWith("http")) {
            return res.status(400).json({ message: "Invalid image format!" });
        }

        // Lấy token từ header
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Token is missing or invalid!" });
        }

        // Tìm người dùng theo token
        const user = await Users.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: "User not authorized!" });
        }

        // Cập nhật avatar
        user.avatar = avatar;
        await user.save();

        res.status(200).json({ message: "Avatar updated successfully!", avatar: user.avatar });
    } catch (error) {
        console.error("Lỗi trong uploadAvatar:", error);
        res.status(500).json({ error: error.message + ": upload avatar error" });
    }
};