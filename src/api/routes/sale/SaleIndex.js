const saleRoute = require('./sale.router')


module.exports = (app) => {
    const api = '/api'
    app.use(api + '/sale', saleRoute);
}