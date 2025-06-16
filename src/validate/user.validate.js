const Users = require('../api/models/user');

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
};

const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};


module.exports.loginValidate = async (req, res, next) => {
    if (!req.body.email) {
        res.json({
            code: 402,
            message: "Email must not be empty."
        });
        return;
    }
    if (!req.body.password || !validatePassword(req.body.password)) {
        res.json({
            code: 402,
            message: "Password must be at least 8 characters long, include letters, numbers, and at least one special character."
        });
        return;
    }
    next();
};


module.exports.registerValidate = async (req, res, next) => {
    const { email, password, userName, phone, address } = req.body;

    if (!userName?.trim() || !userName) {
        res.json({ code: 402, message: "User Name must not be empty." });
        return;
    }
    if (!email?.trim() || !email) {
        res.json({ code: 402, message: "Email must not be empty." });
        return;
    }
    if (!validatePassword(password) || !password?.trim()) {
        res.json({ code: 402, message: "Password is invalid." });
        return;
    }
    if (!validatePhone(phone) || !phone?.trim()) {
        res.json({ code: 402, message: "Phone must be 10 digits." });
        return;
    }
    if (!address?.trim() || !address) {
        res.json({ code: 402, message: "Address must not be empty." });
        return;
    }
    next();
};


module.exports.resetPasswordValidate = async (req, res, next) => {
    if (!req.body.password || !validatePassword(req.body.password)) {
        res.json({
            code: 402,
            message: "Password must be at least 8 characters long, include letters, numbers, and at least one special character."
        });
        return;
    }
    if (!req.body.confirmPassword) {
        res.json({
            code: 402,
            message: "Confirm Password must not be empty."
        });
        return;
    }
    if (req.body.confirmPassword !== req.body.password) {
        res.json({
            code: 402,
            message: "Confirm Password does not match the Password."
        });
        return;
    }
    next();
};
