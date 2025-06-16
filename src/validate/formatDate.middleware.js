module.exports.formatDate = (req, res, next) => {
    if (req.body.transactionDate) {
        const date = new Date(req.body.transactionDate);
        if (!isNaN(date.getTime())) { 
            req.body.transactionDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
        }
    }
    next();
};
