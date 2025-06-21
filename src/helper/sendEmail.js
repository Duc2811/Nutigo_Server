const nodemailer = require('nodemailer');

module.exports.sendEmail = async (email, subject, html) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "nutigo93@gmail.com",
            pass: "zpuc elnv kmox hbrs"
        }
    });

    const mailOptions = {
        from: "nutigo93@gmail.com",
        to: email,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}