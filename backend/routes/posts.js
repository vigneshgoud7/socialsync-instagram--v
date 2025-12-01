const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const fs = require('fs').promises;

// @route   POST /api/posts
router.post('/', protect, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Please upload at least one image' });
        }

        const { caption, location, taggedUsers } = req.body;
        const imagePromises = req.files.map(file => uploadImage(file, 'instagram-clone/posts'));
        const uploadedImages = await Promise.all(imagePromises);
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => { })));

        const post = await Post.create({
            user: req.user.id,
            caption: caption || '',
            images: uploadedImages.map(img => ({ url: img.url, publicId: img.publicId })),
            location: location || '',
            taggedUsers: taggedUsers ? JSON.parse(taggedUsers) : []
        });

        await User.findByIdAndUpdate(req.user.id, { $push: { posts: post._id } });
        await post.populate('user', 'username fullName profilePicture isVerified');

        res.status(201).json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create post' });
    }
});

// @route   GET /api/posts/feed
router.get('/feed', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Use req.user from protect middleware
        const following = req.user.following || [];
        const blockedUsers = req.user.blockedUsers || [];

        const posts = await Post.find({
            user: {
                $in: [...following, req.user.id],
                $nin: blockedUsers // Exclude blocked users
            }
        })
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)
            .populate('user', 'username fullName profilePicture isVerified')
            .populate('comments.user', 'username fullName profilePicture')
            .populate('taggedUsers', 'username fullName');

        res.json({ success: true, posts, page, hasMore: posts.length === limit });
    } catch (error) {
        console.error('Feed Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/posts/:postId
router.get('/:postId', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('user', 'username fullName profilePicture isVerified')
            .populate('comments.user', 'username fullName profilePicture')
            .populate('taggedUsers', 'username fullName');

        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        const isLiked = post.likes.includes(req.user.id);
        res.json({ success: true, post, isLiked });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/posts/user/:userId
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .sort('-createdAt')
            .populate('user', 'username fullName profilePicture isVerified')
            .populate('taggedUsers', 'username fullName');
        res.json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/posts/:postId
router.put('/:postId', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { caption, location, hideLikesCount, commentsDisabled } = req.body;
        if (caption !== undefined) post.caption = caption;
        if (location !== undefined) post.location = location;
        if (hideLikesCount !== undefined) post.hideLikesCount = hideLikesCount;
        if (commentsDisabled !== undefined) post.commentsDisabled = commentsDisabled;
        await post.save();

        res.json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/posts/:postId
router.delete('/:postId', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Promise.all(post.images.map(image => deleteImage(image.publicId)));
        await User.findByIdAndUpdate(req.user.id, { $pull: { posts: post._id, savedPosts: post._id } });
        await post.deleteOne();

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/posts/:postId/like
router.post('/:postId/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.likes.includes(req.user.id)) {
            return res.status(400).json({ success: false, message: 'Post already liked' });
        }

        post.likes.push(req.user.id);
        await post.save();
        res.json({ success: true, message: 'Post liked', likesCount: post.likes.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/posts/:postId/like
router.delete('/:postId/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        post.likes = post.likes.filter(userId => userId.toString() !== req.user.id);
        await post.save();
        res.json({ success: true, message: 'Post unliked', likesCount: post.likes.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/posts/:postId/comment
router.post('/:postId/comment', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.commentsDisabled) {
            return res.status(403).json({ success: false, message: 'Comments are disabled' });
        }

        post.comments.push({ user: req.user.id, text: text.trim() });
        await post.save();
        await post.populate('comments.user', 'username fullName profilePicture');

        res.status(201).json({ success: true, comment: post.comments[post.comments.length - 1] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/posts/:postId/comment/:commentId
router.delete('/:postId/comment/:commentId', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
        if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        comment.deleteOne();
        await post.save();
        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/posts/:postId/save
router.post('/:postId/save', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        const user = await User.findById(req.user.id);
        if (user.savedPosts.includes(post._id)) {
            return res.status(400).json({ success: false, message: 'Post already saved' });
        }

        user.savedPosts.push(post._id);
        await user.save();
        res.json({ success: true, message: 'Post saved' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/posts/:postId/save
router.delete('/:postId/save', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.savedPosts = user.savedPosts.filter(postId => postId.toString() !== req.params.postId);
        await user.save();
        res.json({ success: true, message: 'Post unsaved' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/posts/saved/all
router.get('/saved/all', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'savedPosts',
            populate: { path: 'user', select: 'username fullName profilePicture isVerified' }
        });
        res.json({ success: true, posts: user.savedPosts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
