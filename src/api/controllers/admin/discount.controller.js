const Discount = require('../../models/discount');
const UserDiscount = require('../../models/userDiscounts');
const User = require('../../models/user');
const PaginationHelper = require('../../../helper/pagination');

module.exports.getAllDiscount = async (req, res) => {
    try {
        const totalProducts = await Discount.countDocuments({ isActive: true });
        if (totalProducts === 0) {
            return res.status(404).json({ message: 'No discounts found!' });
        }
        const paginationData = await PaginationHelper(
            {
                currentPage: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 12
            },
            totalProducts,
            req.query
        );
        const discounts = await Discount.find({ isActive: true })
            .skip(paginationData.skip)
            .limit(paginationData.limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Discounts found',
            data: {
                discounts,
                totalPages: paginationData.totalPage,
                currentPage: paginationData.currentPage,
                totalProducts: totalProducts
            }
        });
    } catch (error) {
        res.status(500).json({ message: `Discount error: ${error.message}` });
    }
};



module.exports.getDiscountById = async (req, res) => {
    try {
        const { discountId } = req.params;
        const discount = await Discount.findById(discountId);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found!' });
        }
        res.status(200).json(discount);
    } catch (error) {
        res.status(500).json({ message: `Discount error: ${error.message}` });
    }
};

module.exports.adminGetAllDiscount = async (req, res) => {
    try {
        const totalProducts = await Discount.countDocuments({ isActive: true });
        if (totalProducts === 0) {
            return res.status(404).json({ message: 'No discounts found!' });
        }
        const paginationData = await PaginationHelper(
            {
                currentPage: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 12
            },
            totalProducts,
            req.query
        );
        const discounts = await Discount.find({})
            .skip(paginationData.skip)
            .limit(paginationData.limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Discounts found',
            data: {
                discounts,
                totalPages: paginationData.totalPage,
                currentPage: paginationData.currentPage,
                totalProducts: totalProducts
            }
        });
    } catch (error) {
        res.status(500).json({ message: `Discount error: ${error.message}` });
    }
};

module.exports.getDiscountByUser = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        const discounts = await UserDiscount.find({ userId: user._id })
            .populate({
                path: 'discountId'
            });

        if (!discounts || discounts.length === 0) {
            return res.status(404).json({ message: 'No discounts found for this user!' });
        }
        const activeDiscounts = discounts.filter(discount =>
            discount.discountId && discount.discountId.some(d => d.isActive === true)
        );
        if (activeDiscounts.length === 0) {
            return res.status(400).json({
                message: 'Discounts have expired or are currently not in use!'
            });
        }
        res.status(200).json(activeDiscounts);
    } catch (error) {
        res.status(500).json(error);
    }
}

module.exports.createDiscount = async (req, res) => {
    try {
        const { discountType, discountValue, rate, startAt, endAt } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to create a discount!' });
        }

        if (rate < 0 || rate > 100) {
            return res.status(400).json({ message: 'Rate must be between 0 and 100' });
        }

        if (!endAt) {
            return res.status(400).json({ message: 'endAt is required' });
        }

        const discount = new Discount({
            discountType,
            discountValue,
            rate,
            startAt: startAt ? new Date(startAt) : Date.now(),
            endAt: new Date(endAt),
        });

        await discount.save();
        res.status(200).json(discount);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};

module.exports.updateDiscount = async (req, res) => {
    try {
        const { discountId } = req.params;
        const { discountType, discountValue, rate, startAt, endAt } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not authorized to update a discount!' });
        }

        const totalRate = await Discount.aggregate([
            { $match: { _id: { $ne: discountId } } },
            { $group: { _id: null, totalRate: { $sum: "$rate" } } }
        ]);

        if (totalRate[0].totalRate + rate > 100) {
            return res.status(400).json({ message: 'Total discount rate cannot exceed 100%' });
        }

        const discount = await Discount.findByIdAndUpdate(discountId, { discountType, discountValue, rate, startAt: startAt ? new Date(startAt) : Date.now(), endAt: new Date(endAt) }, { new: true });
        res.status(200).json(discount);
    } catch (error) {
        res.status(500).json(error);
    }
}


module.exports.deleteDiscount = async (req, res) => {
    try {
        const { discountId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not authorized to delete a discount' });
        }
        await Discount.findByIdAndDelete(discountId);
        res.status(200).json({ message: "Delete discount successfully" });
    } catch (error) {
        res.status(500).json(error);
    }
}



module.exports.toggleDiscountStatus = async (req, res) => {
    try {
        const { discountId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not authorized to toggle a discount!' });
        }
        const discount = await Discount.findById(discountId);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found!' });
        }
        const updatedDiscount = await Discount.findByIdAndUpdate(
            discountId,
            { isActive: !discount.isActive }, 
            { new: true }
        );

        res.status(200).json({
            message: updatedDiscount.isActive ? 'Activated discount successfully' : 'Deactivated discount successfully',
            discount: updatedDiscount
        });

    } catch (error) {
        console.error('Error toggling discount status:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};



module.exports.getUserDiscount = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        const userDiscount = await UserDiscount.find({ userId: user._id });
        res.status(200).json(userDiscount);
    } catch (error) {
        res.status(500).json(error);
    }
}




module.exports.assignDiscount = async (req, res) => {
    try {
        const { discountId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        let userDiscount = await UserDiscount.findOne({ userId: user._id });

        if (!userDiscount) {
            userDiscount = new UserDiscount({
                userId: user._id,
                withdrawalNumber: 1, 
                discountId: []
            });
        }

        if (userDiscount.withdrawalNumber <= 0) {
            return res.status(400).json({
                message: 'User cannot spin because withdrawalNumber is 0!'
            });
        }

        if (discountId === 'null' || !discountId) {
            userDiscount.withdrawalNumber -= 1;
            await userDiscount.save();

            return res.status(200).json({
                message: 'No discount assigned (Good Luck Next Time)!',
                userDiscount: {
                    userId: userDiscount.userId,
                    withdrawalNumber: userDiscount.withdrawalNumber,
                    discountId: userDiscount.discountId
                }
            });
        }

        const discount = await Discount.findById(discountId);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found!' });
        }

        if (!discount.isActive) {
            return res.status(400).json({ message: 'Discount is not active!' });
        }

        userDiscount.discountId.push(discount._id);
        userDiscount.withdrawalNumber -= 1;
        await userDiscount.save();

        return res.status(200).json({
            message: 'Discount assigned to user successfully!',
            userDiscount: {
                userId: userDiscount.userId,
                withdrawalNumber: userDiscount.withdrawalNumber,
                discountId: userDiscount.discountId
            }
        });

    } catch (error) {
        console.error('Error in assignDiscount:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
module.exports.unassignDiscount = async (req, res) => {
    try {
        const { discountId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }
        let userDiscount = await UserDiscount.findOne({ userId: user._id });
        if (!userDiscount) {
            return res.status(404).json({ message: 'User discount not found!' });
        }
        const discountIndex = userDiscount.discountId.indexOf(discountId);
        if (discountIndex === -1) {
            return res.status(404).json({ message: 'Discount not found in user\'s discounts!' });
        }

        userDiscount.discountId.splice(discountIndex, 1);
        if (userDiscount.discountId.length === 0) {
            await UserDiscount.findOneAndDelete({ userId: user._id });
            return res.status(200).json({
                message: 'Discount removed and user discount deleted successfully!'
            });
        } else {
            await userDiscount.save();
            return res.status(200).json({
                message: 'Discount removed from user successfully!',
                userDiscount
            });
        }

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};


module.exports.getAllUserDiscount = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        const userDiscount = await UserDiscount.find({
            userId: user._id
        })
            .populate({
                path: 'discountId',
                match: { isActive: true }
            });

        const filteredUserDiscount = userDiscount.filter(ud =>
            ud.discountId && ud.discountId.length > 0
        );

        res.status(200).json(filteredUserDiscount);
    } catch (error) {
        res.status(500).json(error);
    }
}

module.exports.getRecentDiscounts = async (req, res) => {
    try {
        const { days, months, years } = req.body;

        let filterDate = new Date();

        if (days) {
            filterDate.setDate(filterDate.getDate() - parseInt(days));
        } else if (months) {
            filterDate.setMonth(filterDate.getMonth() - parseInt(months));
        } else if (years) {
            filterDate.setFullYear(filterDate.getFullYear() - parseInt(years));
        } else {
            return res.status(400).json({ message: "Please provide days, months, or years to filter." });
        }
        const recentDiscounts = await Discount.find({
            createdAt: { $gte: filterDate }
        });

        if (recentDiscounts.length === 0) {
            return res.status(404).json({ message: "No discounts found in the given time period." });
        }

        const countDocuments = await Discount.countDocuments({
            createdAt: { $gte: filterDate }
        });

        if (countDocuments === 0) {
            return res.status(404).json({ message: "No discounts found in the given time period." });
        }
        res.status(200).json({
            message: "Recent discounts retrieved successfully.",
            total: countDocuments,
            recentDiscounts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


module.exports.getDiscountUsageStats = async (req, res) => {
    try {
        const { days, months, years } = req.body;
        let filterDate = new Date();
        if (days) {
            filterDate.setDate(filterDate.getDate() - parseInt(days));
        } else if (months) {
            filterDate.setMonth(filterDate.getMonth() - parseInt(months));
        } else if (years) {
            filterDate.setFullYear(filterDate.getFullYear() - parseInt(years));
        } else {
            filterDate = null; 
        }

        const matchStage = filterDate ? { createdAt: { $gte: filterDate } } : {};

        const usageStats = await UserDiscount.aggregate([
            { $match: matchStage },
            { $unwind: '$discountId' },
            {
                $group: {
                    _id: '$discountId',
                    totalAssignments: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'discounts',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'discountDetails'
                }
            },
            { $unwind: '$discountDetails' },
            {
                $project: {
                    discountId: '$_id',
                    code: '$discountDetails.code',
                    discountType: '$discountDetails.discountType',
                    discountValue: '$discountDetails.discountValue',
                    totalAssignments: 1,
                    isActive: '$discountDetails.isActive'
                }
            }
        ]);

        if (usageStats.length === 0) {
            return res.status(404).json({ message: 'No discount usage found.' });
        }

        res.status(200).json({
            message: 'Discount usage statistics retrieved successfully.',
            total: usageStats.length,
            data: usageStats
        });
    } catch (error) {
        console.error('Error fetching discount usage stats:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.getActiveDiscountsOverview = async (req, res) => {
    try {
        const currentDate = new Date();
        const activeDiscounts = await Discount.find({
            isActive: true,
            endAt: { $gte: currentDate }
        }).select('code discountType discountValue rate startAt endAt');

        if (activeDiscounts.length === 0) {
            return res.status(404).json({ message: 'No active discounts found.' });
        }

        const formattedDiscounts = activeDiscounts.map(discount => ({
            discountId: discount._id,
            code: discount.code,
            discountType: discount.discountType,
            discountValue: discount.discountValue,
            rate: discount.rate,
            startAt: discount.startAt,
            endAt: discount.endAt,
            daysRemaining: Math.ceil((discount.endAt - currentDate) / (1000 * 60 * 60 * 24))
        }));

        res.status(200).json({
            message: 'Active discounts retrieved successfully.',
            total: activeDiscounts.length,
            data: formattedDiscounts
        });
    } catch (error) {
        console.error('Error fetching active discounts:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.getUserDiscountActivity = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to view this data!' });
        }

        const userActivity = await UserDiscount.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: '$userDetails' },
            {
                $lookup: {
                    from: 'discounts',
                    localField: 'discountId',
                    foreignField: '_id',
                    as: 'discountDetails'
                }
            },
            {
                $project: {
                    userId: '$userId',
                    username: '$userDetails.username',
                    email: '$userDetails.email',
                    totalDiscounts: { $size: '$discountId' },
                    activeDiscounts: {
                        $filter: {
                            input: '$discountDetails',
                            as: 'discount',
                            cond: { $and: [{ $eq: ['$$discount.isActive', true] }, { $gte: ['$$discount.endAt', new Date()] }] }
                        }
                    },
                    expiredDiscounts: {
                        $filter: {
                            input: '$discountDetails',
                            as: 'discount',
                            cond: { $or: [{ $eq: ['$$discount.isActive', false] }, { $lt: ['$$discount.endAt', new Date()] }] }
                        }
                    }
                }
            },
            {
                $project: {
                    userId: 1,
                    username: 1,
                    email: 1,
                    totalDiscounts: 1,
                    activeDiscountCount: { $size: '$activeDiscounts' },
                    expiredDiscountCount: { $size: '$expiredDiscounts' }
                }
            }
        ]);

        if (userActivity.length === 0) {
            return res.status(404).json({ message: 'No user discount activity found.' });
        }

        res.status(200).json({
            message: 'User discount activity retrieved successfully.',
            total: userActivity.length,
            data: userActivity
        });
    } catch (error) {
        console.error('Error fetching user discount activity:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.getExpiredDiscountsReport = async (req, res) => {
    try {
        const { days, months, years } = req.body;
        let filterDate = new Date();

        if (days) {
            filterDate.setDate(filterDate.getDate() - parseInt(days));
        } else if (months) {
            filterDate.setMonth(filterDate.getMonth() - parseInt(months));
        } else if (years) {
            filterDate.setFullYear(filterDate.getFullYear() - parseInt(years));
        } else {
            return res.status(400).json({ message: 'Please provide days, months, or years to filter.' });
        }

        const expiredDiscounts = await Discount.find({
            endAt: { $lte: new Date() },
            createdAt: { $gte: filterDate }
        });

        const expiredWithUsage = await Promise.all(expiredDiscounts.map(async (discount) => {
            const usageCount = await UserDiscount.countDocuments({ discountId: { $in: [discount._id] } });
            return {
                discountId: discount._id,
                code: discount.code,
                discountType: discount.discountType,
                discountValue: discount.discountValue,
                rate: discount.rate,
                endAt: discount.endAt,
                usageCount
            };
        }));

        if (expiredWithUsage.length === 0) {
            return res.status(404).json({ message: 'No expired discounts found in the given time period.' });
        }

        res.status(200).json({
            message: 'Expired discounts report retrieved successfully.',
            total: expiredWithUsage.length,
            data: expiredWithUsage
        });
    } catch (error) {
        console.error('Error fetching expired discounts:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.getDiscountTypeDistribution = async (req, res) => {
    try {
        const distribution = await Discount.aggregate([
            {
                $group: {
                    _id: '$discountType',
                    totalDiscounts: { $sum: 1 },
                    activeDiscounts: {
                        $sum: { $cond: [{ $and: [{ $eq: ['$isActive', true] }, { $gte: ['$endAt', new Date()] }] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    discountType: '$_id',
                    totalDiscounts: 1,
                    activeDiscounts: 1,
                    _id: 0
                }
            }
        ]);

        const usageByType = await UserDiscount.aggregate([
            { $unwind: '$discountId' },
            {
                $lookup: {
                    from: 'discounts',
                    localField: 'discountId',
                    foreignField: '_id',
                    as: 'discountDetails'
                }
            },
            { $unwind: '$discountDetails' },
            {
                $group: {
                    _id: '$discountDetails.discountType',
                    totalAssignments: { $sum: 1 }
                }
            },
            {
                $project: {
                    discountType: '$_id',
                    totalAssignments: 1,
                    _id: 0
                }
            }
        ]);

        // Merge distribution and usage data
        const result = distribution.map(type => ({
            discountType: type.discountType,
            totalDiscounts: type.totalDiscounts,
            activeDiscounts: type.activeDiscounts,
            totalAssignments: usageByType.find(u => u.discountType === type.discountType)?.totalAssignments || 0
        }));

        if (result.length === 0) {
            return res.status(404).json({ message: 'No discount types found.' });
        }

        res.status(200).json({
            message: 'Discount type distribution retrieved successfully.',
            total: result.length,
            data: result
        });
    } catch (error) {
        console.error('Error fetching discount type distribution:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.addWithdrawalNumber = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        const { withdrawalNumber } = req.body;

        if (!withdrawalNumber || typeof withdrawalNumber !== 'number') {
            return res.status(400).json({ message: 'Invalid withdrawalNumber value!' });
        }

        let userDiscount = await UserDiscount.findOne({ userId: user._id });

        if (userDiscount) {
            userDiscount = await UserDiscount.findOneAndUpdate(
                { userId: user._id },
                { $inc: { withdrawalNumber: withdrawalNumber } },
                { new: true }
            );
        } else {
            userDiscount = new UserDiscount({
                userId: user._id,
                withdrawalNumber: withdrawalNumber,
                discountId: []
            });
            await userDiscount.save();
        }

        res.status(200).json(userDiscount);

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

// controller.js
module.exports.getAllUserHaveDiscount = async (req, res) => {
    try {
        const usersWithDiscount = await UserDiscount.find({})
            .populate('userId')      
            .populate('discountId'); 

        res.status(200).json(usersWithDiscount);
    } catch (error) {
        console.error('Error fetching users with discounts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
