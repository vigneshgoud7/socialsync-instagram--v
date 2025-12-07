// Update last active timestamp on each request

const updateActivity = async (req, res, next) => {
    if (req.user && req.user.id) {
        try {
            // Update lastActive field without waiting
            const User = require('../models/User');
            User.findByIdAndUpdate(req.user.id, { lastActive: new Date() })
                .catch(err => console.error('Error updating last active:', err));
        } catch (error) {
            // Silent fail - don't block the request
            console.error('Activity middleware error:', error);
        }
    }
    next();
};

module.exports = { updateActivity };
