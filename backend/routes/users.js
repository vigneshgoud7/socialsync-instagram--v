const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// @route   GET /api/users/search
router.get('/search', protect, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length === 0) {
            return res.json({ success: true, users: [] });
        }

        const currentUser = await User.findById(req.user.id);

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { fullName: { $regex: q, $options: 'i' } }
            ],
            _id: { $nin: currentUser.blockedUsers } // Exclude blocked users
        }).select('username fullName profilePicture isVerified').limit(20);

        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/users/:username
router.get('/:username', protect, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .populate('followers following', 'username fullName profilePicture')
            .populate('posts');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentUser = await User.findById(req.user.id);

        // Check if blocked
        const isBlocked = currentUser.blockedUsers.includes(user._id);
        const hasBlockedMe = user.blockedUsers.includes(currentUser._id);

        if (hasBlockedMe) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isFollowing = user.followers.some(f => f._id.toString() === req.user.id);
        const isOwnProfile = user._id.toString() === req.user.id;

        res.json({ success: true, user, isFollowing, isOwnProfile, isBlocked });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { fullName, bio, website, isPrivate } = req.body;
        const user = await User.findById(req.user.id);

        if (fullName !== undefined) user.fullName = fullName;
        if (bio !== undefined) user.bio = bio;
        if (website !== undefined) user.website = website;
        if (isPrivate !== undefined) user.isPrivate = isPrivate;

        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/users/profile-picture
router.put('/profile-picture', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }

        const user = await User.findById(req.user.id);
        if (user.profilePicture.publicId) {
            await deleteImage(user.profilePicture.publicId);
        }

        const result = await uploadImage(req.file, 'instagram-clone/profile-pictures');
        user.profilePicture = { url: result.url, publicId: result.publicId };
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile picture' });
    }
});

// @route   POST /api/users/:userId/follow
router.post('/:userId/follow', protect, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (currentUser.following.includes(userToFollow._id)) {
            return res.status(400).json({ success: false, message: 'Already following this user' });
        }

        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);
        await currentUser.save();
        await userToFollow.save();

        res.json({ success: true, message: 'Successfully followed user' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/users/:userId/follow
router.delete('/:userId/follow', protect, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);

        if (!userToUnfollow) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        currentUser.following = currentUser.following.filter(id => id.toString() !== userToUnfollow._id.toString());
        userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUser._id.toString());
        await currentUser.save();
        await userToUnfollow.save();

        res.json({ success: true, message: 'Successfully unfollowed user' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/users/:userId/followers
router.get('/:userId/followers', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('followers', 'username fullName profilePicture isVerified');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, followers: user.followers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/users/:userId/following
router.get('/:userId/following', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('following', 'username fullName profilePicture isVerified');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, following: user.following });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

// @route   POST /api/users/:userId/block
router.post('/:userId/block', protect, async (req, res) => {
    try {
        const userToBlock = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);

        if (!userToBlock) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (currentUser.blockedUsers.includes(userToBlock._id)) {
            return res.status(400).json({ success: false, message: 'User already blocked' });
        }

        // Add to blocked list
        currentUser.blockedUsers.push(userToBlock._id);

        // Unfollow each other
        currentUser.following = currentUser.following.filter(id => id.toString() !== userToBlock._id.toString());
        currentUser.followers = currentUser.followers.filter(id => id.toString() !== userToBlock._id.toString());

        userToBlock.following = userToBlock.following.filter(id => id.toString() !== currentUser._id.toString());
        userToBlock.followers = userToBlock.followers.filter(id => id.toString() !== currentUser._id.toString());

        await currentUser.save();
        await userToBlock.save();

        res.json({ success: true, message: 'User blocked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/users/:userId/block
router.delete('/:userId/block', protect, async (req, res) => {
    try {
        const userToUnblock = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);

        if (!userToUnblock) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userToUnblock._id.toString());
        await currentUser.save();

        res.json({ success: true, message: 'User unblocked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
