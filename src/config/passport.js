const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Users = require('../api/models/user');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/api/user/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Kiểm tra xem user đã tồn tại chưa
      let user = await Users.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Nếu chưa tồn tại, tạo user mới
        user = new Users({
          googleId: profile.id,
          userName: profile.displayName,
          email: profile.emails[0].value,
          status: 'active',
          avatar: profile.photos[0].value
        });
        await user.save();
      } else {
        // Nếu đã tồn tại, cập nhật googleId nếu chưa có
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
      }
      
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Users.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;