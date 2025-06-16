const cron = require('node-cron');
const Discount = require('../../models/discount');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const result = await Discount.updateMany(
      { endAt: { $lt: now }, isActive: true },
      { $set: { isActive: false } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Scheduler] Deactivated ${result.modifiedCount} expired discounts`);
    }
  } catch (error) {
    console.error('[Scheduler] Error updating discounts:', error);
  }
});
