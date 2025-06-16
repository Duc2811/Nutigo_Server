const userRoute = require('./user.router')
const adsRoute = require('./ads.router')
const blogRoute = require('./blog.router')
const discountRoute = require('./discount.router')
module.exports = (app) => {
    const api = '/api'
    app.use(api + '/admin', userRoute);
    app.use(api + '/ads', adsRoute);
    app.use(api + '/blog', blogRoute);
    app.use(api + '/discount', discountRoute);
}