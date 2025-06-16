const userRoute = require('./user.router')
const productRoute = require('./product.router')
const categoryRoute = require('./category.router')
const orderRoute = require('./order.router')
const paymentRoute = require('../client/payment/payment.router')
const transactionRoute = require('../client/payment/transactions.router')
const saleRoute = require('./sale.router')
const feedbackRoute = require('./feedback.router')
const chatRoute = require('./chat.router')
module.exports = (app) => {
    const api = '/api'
    app.use(api + '/user', userRoute);
    app.use(api + '/product', productRoute);
    app.use(api + '/category', categoryRoute);
    app.use(api + '/order', orderRoute);
    app.use(api + '/payment', paymentRoute);
    app.use(api + '/transaction', transactionRoute);
    app.use(api + '/sale', saleRoute);
    app.use(api + '/feedback', feedbackRoute);
    app.use(api + '/chat', chatRoute);
}