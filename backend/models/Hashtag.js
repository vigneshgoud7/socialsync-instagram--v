const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema({
    tag: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    postCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for finding trending hashtags
hashtagSchema.index({ postCount: -1, lastUsed: -1 });

module.exports = mongoose.model('Hashtag', hashtagSchema);
