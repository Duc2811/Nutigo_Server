const calculateTotalRate = async () => {
    const totalRate = await Discount.aggregate([
        { $group: { _id: null, totalRate: { $sum: "$rate" } } }
    ]);
    return totalRate[0].totalRate;
}
