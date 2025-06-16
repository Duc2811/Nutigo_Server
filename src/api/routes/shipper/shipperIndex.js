const shipperRoute = require('./shipper')


module.exports = (app) => {
    const api = '/api'
    app.use(api + '/shipper', shipperRoute);
}