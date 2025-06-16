let express = require('express');
let router = express.Router();

const controller = require('../../../controllers/payment/vnpay.controller');
const authorization = require('../../../../middleware/user.middleware');

router.post('/create_payment_url', authorization.Authorization, controller.createPaymentUrl);
router.get('/return_url', controller.returnUrl);
router.post('/query', controller.query);
router.get('/vnpay_ipn', controller.vnpay_ipn);
router.post('/refund', controller.refund);

module.exports = router;