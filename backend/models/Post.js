const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    caption: {
        type: String,
        maxlength: [2200, 'Caption cannot exceed 2200 characters'],
        default: ''
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        }
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [commentSchema],
    location: {
        type: String,
        default: ''
    },
    taggedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    hashtags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    shareCount: {
        type: Number,
        default: 0
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    hideLikesCount: {
        type: Boolean,
        default: false
    },
    commentsDisabled: {
        type: Boolean,
        default: false
    },
    // Analytics - View tracking
    views: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for likes count
postSchema.virtual('likesCount').get(function () {
    return this.likes.length;
});

// Virtual for comments count
postSchema.virtual('commentsCount').get(function () {
    return this.comments.length;
});

// Virtual for view count
postSchema.virtual('viewCount').get(function () {
    return this.views ? this.views.length : 0;
});

// Virtual for engagement rate
postSchema.virtual('engagementRate').get(function () {
    if (!this.views || this.views.length === 0) return 0;
    const totalEngagements = this.likes.length + this.comments.length + (this.shareCount || 0);
    return ((totalEngagements / this.views.length) * 100).toFixed(2);
});

// Index for faster queries
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'views.user': 1 }); // For analytics queries

module.exports = mongoose.model('Post', postSchema);
