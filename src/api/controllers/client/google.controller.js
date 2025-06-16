const Users = require("../../models/user");

// Handle Google authentication callback
module.exports.googleCallback = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                code: 401,
                message: 'Authentication failed'
            });
        }

        // Tạo token cho user
        const token = req.user.token;
        
        // Redirect to frontend with user data
        res.redirect(`http://localhost:5173/google-callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: req.user._id,
            userName: req.user.userName,
            email: req.user.email,
            avatar: req.user.avatar,
            role: req.user.role
        }))}`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('Authentication failed')}`);
    }
};

// Test route to check authentication status
module.exports.testAuth = (req, res) => {
    try {
        if (req.isAuthenticated()) {
            res.json({
                code: 200,
                message: 'Đã đăng nhập',
                user: req.user
            });
        } else {
            res.json({
                code: 401,
                message: 'Chưa đăng nhập'
            });
        }
    } catch (error) {
        console.error('Test auth error:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal Server Error',
            error: error.message
        });
    }
}; 