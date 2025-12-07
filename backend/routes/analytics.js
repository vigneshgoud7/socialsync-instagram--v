const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// @route   POST /api/posts/:postId/view
// @desc    Track post view
// @access  Private
router.post('/:postId/view', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Check if user already viewed this post
        const alreadyViewed = post.views.some(
            view => view.user.toString() === req.user.id
        );

        if (!alreadyViewed) {
            post.views.push({ user: req.user.id, timestamp: new Date() });
            await post.save();
        }

        res.json({ success: true, viewCount: post.views.length });
    } catch (error) {
        console.error('View tracking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/posts/:postId/analytics
// @desc    Get post analytics
// @access  Private
router.get('/:postId/analytics', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('user', 'username fullName profilePicture')
            .populate('likes', 'username fullName profilePicture')
            .populate('views.user', 'username fullName profilePicture');

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Only post owner can view analytics
        if (post.user._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const analytics = {
            viewCount: post.viewCount,
            likeCount: post.likes.length,
            commentCount: post.comments.length,
            shareCount: post.shareCount || 0,
            engagementRate: post.engagementRate,
            likes: post.likes.map(user => ({
                username: user.username,
                fullName: user.fullName,
                profilePicture: user.profilePicture
            })),
            recentViews: post.views
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 20)
                .map(view => ({
                    username: view.user.username,
                    fullName: view.user.fullName,
                    profilePicture: view.user.profilePicture,
                    timestamp: view.timestamp
                }))
        };

        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
