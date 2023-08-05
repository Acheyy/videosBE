// scheduledJobs.js
const cron = require('node-cron');
const User = require('./models/User'); // Adjust the path to your User model

const checkExpiredPremiumMemberships = async () => {
  const expiredMemberships = await User.find({
    isUserPremium: true,
    premiumExpiry: { $lte: new Date() },
  });

  expiredMemberships.forEach(async (user) => {
    user.isUserPremium = false;
    user.premiumExpiry = null;
    await user.save();
  });
};

// Schedule the job to run every day at midnight
cron.schedule('0 0 * * *', checkExpiredPremiumMemberships);

module.exports = { checkExpiredPremiumMemberships };
