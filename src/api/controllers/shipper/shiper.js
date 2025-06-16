
const User = require('../../models/user')
const Order = require('../../models/order')
const Product = require('../../models/product');
const sendEmail = require('../../../helper/sendEmail')
// Chấp nhận đơn hàng
module.exports.acceptOrder = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token bị thiếu hoặc không hợp lệ!" });
        }

        const shipper = await User.findOne({ token });
        if (!shipper || shipper.role.toLowerCase() !== "shipper") {
            return res.status(403).json({ message: "Không có quyền truy cập! Chỉ vai trò shipper mới được phép." });
        }

        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ message: "orderId là bắt buộc!" });
        }



        const order = await Order.findById(orderId).populate("products.productId");
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
        }

        if (order.status !== "Pending") {
            return res.status(400).json({ message: "Chỉ có thể chấp nhận đơn hàng đang ở trạng thái Pending!" });
        }

        // Kiểm tra số lượng tồn kho
        for (const item of order.products) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Sản phẩm với ID ${item.productId} không tồn tại!` });
            }

            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Sản phẩm ${product.name} không đủ số lượng tồn kho! Hiện có: ${product.quantity}, cần: ${item.quantity}`,
                });
            }
        }

        // Trừ số lượng tồn kho và tăng số lượng đã bán
        for (const item of order.products) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: {
                    quantity: -item.quantity,
                    sold: item.quantity,
                },
            });
        }

        // Cập nhật trạng thái đơn hàng thành Processing
        order.status = "Processing";
        await order.save();

        res.status(200).json({ message: "Chấp nhận đơn hàng thành công và đã cập nhật số lượng tồn kho!" });
    } catch (error) {
        console.error("Lỗi khi chấp nhận đơn hàng:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", error: error.message });
    }
};

// Complete Order: Changes status from "Processing" to "Completed"
module.exports.completeOrder = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token bị thiếu hoặc không hợp lệ!" });
        }

        const shipper = await User.findOne({ token });
        if (!shipper || shipper.role.toLowerCase() !== "shipper") {
            return res.status(403).json({ message: "Không có quyền truy cập! Chỉ vai trò shipper mới được phép." });
        }

        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ message: "orderId là bắt buộc!" });
        }



        const order = await Order.findById(orderId).populate('userId');
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
        }

        if (order.status !== "Processing") {
            return res.status(400).json({ message: "Chỉ có thể hoàn thành đơn hàng đang ở trạng thái Processing!" });
        }

        // Cập nhật trạng thái đơn hàng thành Completed
        order.status = "Completed";
        order.paymentStatus = "Completed"
        if (!order.userId.email) {
            return res.status(404).json({ message: "Không tìm thấy email!" });
        }
        const formatCurrency = (amount) =>
            new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                minimumFractionDigits: 0,
            }).format(amount);
        const subject = `Cập nhật đơn hàng từ L-Shop`;
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              padding: 20px;
              color: #333;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .email-header {
              background-color: #4caf50;
              color: #fff;
              text-align: center;
              padding: 16px;
              font-size: 22px;
            }
            .email-body {
              padding: 24px;
            }
            .status-box {
              display: inline-block;
              padding: 10px 20px;
              background-color: #e0f7e9;
              border-left: 6px solid #4caf50;
              border-radius: 4px;
              font-size: 18px;
              margin: 16px 0;
            }
            .email-footer {
              background-color: #f1f1f1;
              text-align: center;
              padding: 12px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              Cập nhật đơn hàng
            </div>
            <div class="email-body">
              <p>Xin chào ${order.userId.userName || 'Quý khách'},</p>
              <p>Trạng thái đơn hàng của bạn đã được cập nhật như sau:</p>
              <div class="status-box">
                Trạng thái mới: <strong>${order.status}</strong>
              </div>
              <p>Thông tin đơn hàng:</p>
              <ul>
                <li><strong>Mã đơn hàng:</strong> ${order._id}</li>
                <li><strong>Số tiền:</strong> ${formatCurrency(order.totalAmount)}</li>
              </ul>
              <p>Cảm ơn bạn đã mua sắm tại L-Shop!</p>
              <p>Trân trọng,<br/>Đội ngũ L-Shop</p>
            </div>
            <div class="email-footer">
              © 2025 L-Shop. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        `;
        await sendEmail.sendEmail(order.userId.email, subject, html)
        await order.save();

        res.status(200).json({ message: "Hoàn thành đơn hàng thành công!" });
    } catch (error) {
        console.error("Lỗi khi hoàn thành đơn hàng:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", error: error.message });
    }
};

// Hủy đơn hàng
module.exports.cancelOrder = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token bị thiếu hoặc không hợp lệ!" });
        }

        const shipper = await User.findOne({ token });
        if (!shipper || shipper.role.toLowerCase() !== "shipper") {
            return res.status(403).json({ message: "Không có quyền truy cập! Chỉ vai trò shipper mới được phép." });
        }

        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ message: "orderId là bắt buộc!" });
        }

        const order = await Order.findById(orderId).populate('userId');
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
        }

        if (order.status !== "Pending") {
            return res.status(400).json({ message: "Chỉ có thể hủy đơn hàng đang ở trạng thái Pending!" });
        }

        order.status = "Cancelled";
        if (!order.userId.email) {
            return res.status(404).json({ message: "Không tìm thấy email!" });
        }
        const formatCurrency = (amount) =>
            new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                minimumFractionDigits: 0,
            }).format(amount);
        const subject = "Đơn hàng của bạn đã bị hủy - L-Shop";
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                padding: 20px;
                color: #333;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .email-header {
                background-color: #f44336;
                color: #fff;
                text-align: center;
                padding: 16px;
                font-size: 22px;
            }
            .email-body {
                padding: 24px;
            }
            .status-box {
                display: inline-block;
                padding: 10px 20px;
                background-color: #ffe6e6;
                border-left: 6px solid #f44336;
                border-radius: 4px;
                font-size: 18px;
                margin: 16px 0;
            }
            .email-footer {
                background-color: #f1f1f1;
                text-align: center;
                padding: 12px;
                font-size: 12px;
                color: #777;
            }
            </style>
        </head>
        <body>
            <div class="email-container">
            <div class="email-header">
                Đơn hàng đã bị hủy
            </div>
            <div class="email-body">
                <p>Xin chào ${order.userId.userName || "Quý khách"},</p>
                <p>Chúng tôi rất tiếc thông báo rằng đơn hàng sau đã bị <strong>hủy</strong>:</p>
                <div class="status-box">
                Trạng thái đơn hàng: <strong>Đã hủy (Cancelled)</strong>
                </div>
                <p>Chi tiết đơn hàng:</p>
                <ul>
                <li><strong>Mã đơn hàng:</strong> ${order._id}</li>
                <li><strong>Tổng thanh toán:</strong> ${formatCurrency(order.totalAmount)}</li>
                </ul>
                <p>Nếu có bất kỳ thắc mắc nào, xin vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.</p>
                <p>Trân trọng,<br/>Đội ngũ L-Shop</p>
            </div>
            <div class="email-footer">
                © 2025 L-Shop. All rights reserved.
            </div>
            </div>
        </body>
        </html>
        `;
        await sendEmail.sendEmail(order.userId.email, subject, html)
        await order.save();

        res.status(200).json({ message: "Hủy đơn hàng thành công!" });
    } catch (error) {
        console.error("Lỗi khi hủy đơn hàng:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", error: error.message });
    }
};