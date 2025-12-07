const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
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

// @route   GET /api/users/suggestions
router.get('/suggestions', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);

        // Get list of users the current user is already following
        // Ensure we are working with an array of strings for robust comparison
        const followingIds = currentUser.following.map(id => id.toString());
        const blockedIds = currentUser.blockedUsers.map(id => id.toString());

        // Also exclude users where a follow request is pending
        // We need to find users who have the current user's ID in their followRequests array
        // But since we can't easily query that from here without a complex look up, let's keep it simple for now
        // and just focus on excluding people ALREADY followed.

        // Find users:
        // 1. Not the current user
        // 2. Not in following list
        // 3. Not in blocked list
        const users = await User.find({
            _id: {
                $ne: req.user.id,
                $nin: [...followingIds, ...blockedIds]
            }
        })
            .select('username fullName profilePicture isVerified followRequests')
            .limit(50); // Fetch a pool to filter further if needed

        // Further filter out users who have a pending request FROM the current user
        // This requires checking the 'followRequests' field of the potential suggestion
        const filteredUsers = users.filter(user =>
            !user.followRequests.includes(req.user.id)
        );

        // Randomly select 5 from the filtered list
        const shuffled = filteredUsers.sort(() => 0.5 - Math.random());
        const suggestions = shuffled.slice(0, 5);

        // Map to return structure (removing internal fields like followRequests)
        const result = suggestions.map(user => ({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            profilePicture: user.profilePicture,
            isVerified: user.isVerified
        }));

        res.json({ success: true, suggestions: result });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
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

        // Check if current user has sent a follow request
        const hasRequestedFollow = user.followRequests && user.followRequests.includes(currentUser._id);

        // Privacy enforcement: If account is private and viewer is not a follower
        const isPrivateAndNotFollower = user.isPrivate && !isFollowing && !isOwnProfile;

        // Create user response object
        let userResponse = user.toObject();

        // If private account and not authorized to view, hide sensitive information
        if (isPrivateAndNotFollower) {
            userResponse.followers = [];
            userResponse.following = [];
            userResponse.posts = [];
        }

        // Calculate mutual followers (people who follow this user AND are followed by current user)
        let mutualFollowers = [];
        let mutualCount = 0;

        if (!isOwnProfile && user.followers && user.followers.length > 0) {
            mutualFollowers = user.followers.filter(follower =>
                currentUser.following.some(id => id.toString() === follower._id.toString())
            );
            mutualCount = mutualFollowers.length;
            // Return only first 3 for preview
            mutualFollowers = mutualFollowers.slice(0, 3);
        }

        res.json({
            success: true,
            user: userResponse,
            isFollowing,
            isOwnProfile,
            isBlocked,
            isPrivateAccount: user.isPrivate,
            canViewProfile: !isPrivateAndNotFollower,
            hasRequestedFollow,
            mutualFollowers,
            mutualCount
        });
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

        // Check if already following
        if (currentUser.following.includes(userToFollow._id)) {
            return res.status(400).json({ success: false, message: 'Already following this user' });
        }

        // Check if there's already a pending request
        if (userToFollow.followRequests.includes(currentUser._id)) {
            return res.status(400).json({ success: false, message: 'Follow request already sent' });
        }

        // If account is PRIVATE, send a follow request
        if (userToFollow.isPrivate) {
            userToFollow.followRequests.push(currentUser._id);
            await userToFollow.save();

            // Create notification for follow request
            await Notification.create({
                recipient: userToFollow._id,
                sender: currentUser._id,
                type: 'follow_request'
            });

            return res.json({
                success: true,
                message: 'Follow request sent',
                isPending: true
            });
        }

        // If account is PUBLIC, follow immediately
        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);
        await currentUser.save();
        await userToFollow.save();

        // Create notification for follow
        await Notification.create({
            recipient: userToFollow._id,
            sender: currentUser._id,
            type: 'follow'
        });

        res.json({ success: true, message: 'Successfully followed user', isPending: false });
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

        // Remove from following/followers
        currentUser.following = currentUser.following.filter(id => id.toString() !== userToUnfollow._id.toString());
        userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUser._id.toString());

        // Also remove any pending follow request
        userToUnfollow.followRequests = userToUnfollow.followRequests.filter(id => id.toString() !== currentUser._id.toString());

        await currentUser.save();
        await userToUnfollow.save();

        res.json({ success: true, message: 'Successfully unfollowed user' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/users/follow-requests
// @desc    Get pending follow requests for the current user
router.get('/follow-requests', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('followRequests', 'username fullName profilePicture isVerified');

        res.json({ success: true, requests: user.followRequests || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/users/:userId/accept-request
// @desc    Accept a follow request
router.post('/:userId/accept-request', protect, async (req, res) => {
    try {
        const requester = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);

        if (!requester) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if there's actually a pending request from this user
        if (!currentUser.followRequests.includes(requester._id)) {
            return res.status(400).json({ success: false, message: 'No pending request from this user' });
        }

        // Remove from follow requests
        currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requester._id.toString());

        // Add to followers/following
        currentUser.followers.push(requester._id);
        requester.following.push(currentUser._id);

        await currentUser.save();
        await requester.save();

        // Create notification for accepted follow request
        await Notification.create({
            recipient: requester._id,
            sender: currentUser._id,
            type: 'follow'
        });

        res.json({ success: true, message: 'Follow request accepted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/users/:userId/reject-request
// @desc    Reject a follow request
router.delete('/:userId/reject-request', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);

        if (!currentUser.followRequests.includes(req.params.userId)) {
            return res.status(400).json({ success: false, message: 'No pending request from this user' });
        }

        // Remove from follow requests
        currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== req.params.userId);
        await currentUser.save();

        res.json({ success: true, message: 'Follow request rejected' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/users/notifications/all
// @desc    Get all notifications for current user
router.get('/notifications/all', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort('-createdAt')
            .limit(20)
            .populate('sender', 'username fullName profilePicture isVerified')
            .populate('post', 'images');

        // Get pending follow requests
        const currentUser = await User.findById(req.user.id)
            .populate('followRequests', 'username fullName profilePicture isVerified');

        // Count unread notifications
        const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });

        res.json({
            success: true,
            notifications,
            requests: currentUser.followRequests || [],
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/users/notifications/mark-read
// @desc    Mark all notifications as read for current user
router.post('/notifications/mark-read', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );
        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Mark notifications read error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/users/:userId/followers
router.get('/:userId/followers', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('followers', 'username fullName profilePicture isVerified');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isOwnProfile = user._id.toString() === req.user.id;
        const isFollowing = user.followers.some(f => f._id.toString() === req.user.id);

        // Privacy check: Only followers and account owner can view followers of private accounts
        if (user.isPrivate && !isFollowing && !isOwnProfile) {
            return res.status(403).json({
                success: false,
                message: 'This account is private',
                isPrivate: true
            });
        }

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

        const isOwnProfile = user._id.toString() === req.user.id;
        const isFollowing = user.followers.some(f => f._id.toString() === req.user.id);

        // Privacy check: Only followers and account owner can view following list of private accounts
        if (user.isPrivate && !isFollowing && !isOwnProfile) {
            return res.status(403).json({
                success: false,
                message: 'This account is private',
                isPrivate: true
            });
        }

        res.json({ success: true, following: user.following });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/users/:userId/mutual
router.get('/:userId/mutual', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('followers', 'username fullName profilePicture isVerified');
        const currentUser = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Calculate mutual followers: users who follow the target profile AND are followed by the current user
        // Note: The logic in the profile view was slightly different (users who follow the target profile AND current user follows them)
        // Let's stick to the standard definition: Mutuals = Intersection of (Target's Followers) and (Current User's Following)

        const mutualFollowers = user.followers.filter(follower =>
            currentUser.following.includes(follower._id)
        );

        res.json({ success: true, mutualFollowers });
    } catch (error) {
        console.error('Error getting mutuals:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


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


// @route   DELETE /api/users/account
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/account', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const Post = require('../models/Post');

        // Get user to access their data
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete user's profile picture from cloudinary if exists
        if (user.profilePicture.publicId) {
            try {
                await deleteImage(user.profilePicture.publicId);
            } catch (error) {
                console.error('Error deleting profile picture:', error);
            }
        }

        // Get all user's posts to delete their images
        const userPosts = await Post.find({ author: userId });

        // Delete all images from posts
        for (const post of userPosts) {
            for (const image of post.images) {
                if (image.publicId) {
                    try {
                        await deleteImage(image.publicId);
                    } catch (error) {
                        console.error('Error deleting post image:', error);
                    }
                }
            }
        }

        // Delete all user's posts
        await Post.deleteMany({ author: userId });

        // Remove user from other users' followers/following lists
        await User.updateMany(
            { followers: userId },
            { $pull: { followers: userId } }
        );
        await User.updateMany(
            { following: userId },
            { $pull: { following: userId } }
        );

        // Remove user from other users' blocked lists
        await User.updateMany(
            { blockedUsers: userId },
            { $pull: { blockedUsers: userId } }
        );

        // Remove user's likes from posts
        await Post.updateMany(
            { likes: userId },
            { $pull: { likes: userId } }
        );

        // Remove user's saved posts references
        await Post.updateMany(
            { savedBy: userId },
            { $pull: { savedBy: userId } }
        );

        // Delete user's comments from all posts
        await Post.updateMany(
            { 'comments.author': userId },
            { $pull: { comments: { author: userId } } }
        );

        // Finally, delete the user account
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
});

module.exports = router;
