let $ = require('jquery');
const request = require('request');
const moment = require('moment');
const Transaction = require("../../models/transaction");
const Order = require("../../models/order");
const User = require("../../models/user");
const sendEmail = require('../../../helper/sendEmail');



module.exports.createPaymentUrl = async (req, res) => {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');

    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let config = require('../../../config/default.json');
    let tmnCode = config.vnp_TmnCode;
    let secretKey = config.vnp_HashSecret;
    let vnpUrl = config.vnp_Url;
    let returnUrl = config.vnp_ReturnUrl;

    // Ensure orderId is passed in the request body
    let orderId = req.body.orderId;

    if (!orderId) {
        return res.status(400).json({ message: 'OrderId is required' });
    }

    // Ensure orderId is a valid ObjectId (optional step if you need to ensure this)
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid orderId format' });
    }

    let amount = req.body.amount;
    let bankCode = req.body.bankCode;

    let locale = req.body.language || 'vn';
    let currCode = 'VND';

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;  // Use the passed orderId
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;  // Amount in VND, so multiply by 100
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;  // Optional: Bank code if provided
    }

    vnp_Params = sortObject(vnp_Params);  // Sort the parameters

    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    // Authentication and user validation
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token is missing or invalid!' });
    }

    const user = await User.findOne({ token: token });
    if (!user) {
        return res.status(401).json({ message: 'User not found!' });
    }

    // Create a transaction record linked to the actual order
    const transaction = new Transaction({
        userId: user._id,
        orderId: orderId,  // Ensure orderId is valid
        amount: amount,
        paymentMethod: 'Bank Transfer',
        status: 'Pending',
        description: 'Thanh toan cho ma GD:' + orderId
    });
    await transaction.save();

    res.json({ url: vnpUrl });
    console.log({ orderID: orderId, url: vnpUrl });
}


module.exports.returnUrl = async (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        let config = require('../../../config/default.json');
        let secretKey = config.vnp_HashSecret;
        let frontendUrl = config.frontend_url || 'http://localhost:5173';

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require("crypto");
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        // Get response data
        let responseCode = vnp_Params['vnp_ResponseCode'];
        let orderId = vnp_Params['vnp_TxnRef']; // The order ID
        let amount = vnp_Params['vnp_Amount'] / 100; // Convert back from VND cents
        let transactionId = vnp_Params['vnp_TransactionNo']; // VNPay transaction ID

        console.log(`Received returnUrl callback with orderId: ${orderId}`);

        // Verify the hash to authenticate data
        if (secureHash === signed) {
            const paymentStatus = responseCode === '00' ? 'Completed' : 'Failed';


            // Update order status
            const order = await Order.findById(orderId).populate("products.productId");
            if (order) {
                order.paymentStatus = paymentStatus;
                await order.save();
                console.log(`Updated order ${orderId} status to ${paymentStatus}`);
            } else {
                console.log(`Order ${orderId} not found`);
            }

            // Update transaction status
            const transaction = await Transaction.findOne({ orderId: orderId });
            if (transaction) {
                transaction.status = paymentStatus;
                transaction.transactionId = transactionId; // Store VNPay's transaction ID
                await transaction.save();
                console.log(`Updated transaction for order ${orderId} to ${paymentStatus}`);
            } else {
                console.log(`Transaction for order ${orderId} not found`);
            }

            // Prepare result for frontend
            const paymentResult = {
                status: responseCode === '00' ? 'success' : 'failed',
                message: responseCode === '00' ? 'Thanh toán thành công' : 'Thanh toán thất bại',
                orderId,
                amount,
                transactionId,
                responseCode,
                ...vnp_Params
            };

            const user = await User.findById(transaction.userId);
            
            if (!user) {
                return res.status(401).json({ message: 'User not found!' });
            }
            const userEmail = user.email
            if (paymentStatus === "Completed") {
                const subject = "Your Payment Was Successful - Order Confirmation";
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
                                    .order-details {
                                        margin-top: 20px;
                                    }
                                    .order-details td {
                                        padding: 8px;
                                        border-bottom: 1px solid #ddd;
                                    }
                                    .order-details th {
                                        text-align: left;
                                        padding: 8px;
                                        background-color: #f4f4f4;
                                    }
                                    .email-footer {
                                        text-align: center;
                                        padding: 10px;
                                        background: #f1f1f1;
                                        color: #555;
                                        font-size: 12px;
                                    }
                                    .order-status {
                                        font-size: 20px;
                                        font-weight: bold;
                                        color: #4caf50;
                                        background: #eaf7e1;
                                        padding: 10px;
                                        border-radius: 8px;
                                        display: inline-block;
                                        margin: 10px 0;
                                    }
                                    .total-amount {
                                        font-size: 16px;
                                        font-weight: bold;
                                        color: #333;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="email-container">
                                    <div class="email-header">
                                        Payment Successful - Order Confirmation
                                    </div>
                                    <div class="email-body">
                                        <p>Dear ${userEmail},</p>
                                        <p>We are pleased to inform you that your payment has been successfully processed. Your order is now confirmed, and we are preparing it for shipment.</p>
                                        <div class="order-status">
                                            Order Status: <span>Payment Successful</span>
                                        </div>
                                        <p>Order Details:</p>
                                        <table class="order-details" style="width: 100%; border-collapse: collapse;">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Quantity</th>
                                                    <th>Price (VND)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <!-- Loop through order items dynamically -->
                                                ${order.products.map(item => `
                                                    <tr>
                                                        <td>${item.productId.name}</td>
                                                        <td>${item.quantity}</td>
                                                        <td>${item.price * item.quantity}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                        <div class="total-amount">
                                            Total Amount: ${order.totalAmount} VND
                                        </div>
                                        <p>If you have any questions or concerns about your order, please don't hesitate to contact our support team.</p>
                                        <p>Thank you for shopping with us!</p>
                                        <p>The L-Shop Team</p>
                                    </div>
                                    <div class="email-footer">
                                        © 2025 L-Shop. All rights reserved.
                                    </div>
                                </div>
                            </body>
                            </html>
                            `;
                await sendEmail.sendEmail(userEmail, subject, html)
                console.log("Send email after transaction successfully!!!")
            }

            // Redirect to frontend with payment result
            const returnUrl = `${frontendUrl}/cart/returnQR?${querystring.stringify(paymentResult)}`;
            console.log("Payment result:", paymentResult);

            return res.redirect(returnUrl);
        } else {
            // Authentication failed
            console.log("Data authentication failed!");
            return res.redirect(`${frontendUrl}/cart/returnQR?status=error&message=Xác thực dữ liệu thất bại`);
        }
    } catch (error) {
        console.error("Error processing VNPay callback:", error);
        const frontendUrl = require('../../../config/default.json').frontend_url || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/cart/returnQR?status=error&message=Lỗi server`);
    }
};

module.exports.refund = (req, res) => {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    let date = new Date();

    let config = require('../../../config/default.json');
    let crypto = require("crypto");

    let vnp_TmnCode = config.vnp_TmnCode
    let secretKey = config.vnp_HashSecret
    let vnp_Api = config.vnp_Api

    let vnp_TxnRef = req.body.orderId;
    let vnp_TransactionDate = req.body.transDate;
    let vnp_Amount = req.body.amount * 100;
    let vnp_TransactionType = req.body.transType;
    let vnp_CreateBy = req.body.user;

    let currCode = 'VND';

    let vnp_RequestId = moment(date).format('HHmmss');
    let vnp_Version = '2.1.0';
    let vnp_Command = 'refund';
    let vnp_OrderInfo = 'Hoan tien GD ma:' + vnp_TxnRef;

    let vnp_IpAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;


    let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

    let vnp_TransactionNo = '0';

    let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TransactionType + "|" + vnp_TxnRef + "|" + vnp_Amount + "|" + vnp_TransactionNo + "|" + vnp_TransactionDate + "|" + vnp_CreateBy + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;
    let hmac = crypto.createHmac("sha512", secretKey);
    let vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest("hex");

    let dataObj = {
        'vnp_RequestId': vnp_RequestId,
        'vnp_Version': vnp_Version,
        'vnp_Command': vnp_Command,
        'vnp_TmnCode': vnp_TmnCode,
        'vnp_TransactionType': vnp_TransactionType,
        'vnp_TxnRef': vnp_TxnRef,
        'vnp_Amount': vnp_Amount,
        'vnp_TransactionNo': vnp_TransactionNo,
        'vnp_CreateBy': vnp_CreateBy,
        'vnp_OrderInfo': vnp_OrderInfo,
        'vnp_TransactionDate': vnp_TransactionDate,
        'vnp_CreateDate': vnp_CreateDate,
        'vnp_IpAddr': vnp_IpAddr,
        'vnp_SecureHash': vnp_SecureHash
    };

    request({
        url: vnp_Api,
        method: "POST",
        json: true,
        body: dataObj
    }, function (error, response, body) {
        console.log(response);
    });

}

module.exports.query = (req, res) => {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    let date = new Date();
    let moment = require('moment'); // Added missing moment require

    let config = require('../../../config/default.json');
    let crypto = require("crypto");
    let request = require('request'); // Added missing request require

    let vnp_TmnCode = config.vnp_TmnCode;
    let secretKey = config.vnp_HashSecret;
    let vnp_Api = config.vnp_Api;

    let vnp_TxnRef = req.body.orderId;
    // Use current date formatted as YYYYMMDD instead of requiring transDate
    let vnp_TransactionDate = moment(date).format('YYYYMMDD');

    let vnp_RequestId = moment(date).format('HHmmss');
    let vnp_Version = '2.1.0';
    let vnp_Command = 'querydr';
    let vnp_OrderInfo = 'Truy van GD ma:' + vnp_TxnRef;

    let vnp_IpAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let currCode = 'VND';
    let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

    let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TxnRef + "|" + vnp_TransactionDate + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;

    let hmac = crypto.createHmac("sha512", secretKey);
    let vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest("hex");

    let dataObj = {
        'vnp_RequestId': vnp_RequestId,
        'vnp_Version': vnp_Version,
        'vnp_Command': vnp_Command,
        'vnp_TmnCode': vnp_TmnCode,
        'vnp_TxnRef': vnp_TxnRef,
        'vnp_OrderInfo': vnp_OrderInfo,
        'vnp_TransactionDate': vnp_TransactionDate,
        'vnp_CreateDate': vnp_CreateDate,
        'vnp_IpAddr': vnp_IpAddr,
        'vnp_SecureHash': vnp_SecureHash
    };
    request({
        url: vnp_Api,
        method: "POST",
        json: true,
        body: dataObj
    }, function (error, response, body) {
        if (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        console.log('Response:', body);
        return res.status(200).json(body);
    });
}

module.exports.vnpay_ipn = async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    let config = require('config');
    let secretKey = config.get('vnp_HashSecret');
    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    console.log(`Received vnpay_ipn callback with orderId: ${orderId}`);

    if (secureHash === signed) { //kiểm tra checksum
        const paymentStatus = rspCode === '00' ? 'Completed' : 'Failed';
        await updateOrderAndTransactionStatusLogic(orderId, paymentStatus, paymentStatus);

        if (rspCode === '00') {
            //thanh cong
            res.status(200).json({ RspCode: '00', Message: 'Success' });
        } else {
            //that bai
            res.status(200).json({ RspCode: '00', Message: 'Success' });
        }
    } else {
        res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }
}

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
