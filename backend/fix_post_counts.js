// Script to fix post count inconsistencies
// Run this with: node fix_post_counts.js

const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
require('dotenv').config();

async function fixPostCounts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({});
        console.log(`Found ${users.length} users to check\n`);

        let totalFixed = 0;

        for (const user of users) {
            console.log(`Checking user: @${user.username}`);
            console.log(`  Current posts array: ${user.posts.length} items`);

            // Get actual posts that exist in database
            const actualPosts = await Post.find({ user: user._id }).select('_id');
            const actualPostIds = actualPosts.map(p => p._id.toString());

            console.log(`  Actual posts found: ${actualPostIds.length}`);

            // Find orphaned references
            const orphanedRefs = user.posts.filter(
                postId => !actualPostIds.includes(postId.toString())
            );

            if (orphanedRefs.length > 0) {
                console.log(`  ⚠ Found ${orphanedRefs.length} orphaned references`);

                // Update user's posts array
                user.posts = actualPostIds;
                await user.save();

                console.log(`  ✓ Fixed! New count: ${user.posts.length}\n`);
                totalFixed++;
            } else {
                console.log(`  ✓ No issues\n`);
            }
        }

        console.log('==================');
        console.log(`Cleanup Complete!`);
        console.log(`Fixed ${totalFixed} user(s)`);
        console.log('==================');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixPostCounts();
