const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

let authToken = '';
let userId = '';
let postId = '';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    bold: '\x1b[1m'
};

const log = (msg, type = 'info') => {
    const color = type === 'success' ? colors.green :
        type === 'error' ? colors.red :
            type === 'warning' ? colors.yellow : colors.blue;
    console.log(`${color}${msg}${colors.reset}`);
};

async function request(url, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const options = {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        };

        const response = await fetch(url, options);
        const data = await response.json();

        return { status: response.status, data };
    } catch (error) {
        return { status: 500, error: error.message };
    }
}

async function runTests() {
    console.log(colors.bold + '\n🚀 Starting API Verification Tests...\n' + colors.reset);

    // 1. Health Check
    log('1️⃣  Testing Health Endpoint...', 'info');
    const health = await request(`${BASE_URL}/health`);
    if (health.status === 200 && health.data.success) {
        log('   ✅ Health check passed', 'success');
    } else {
        log(`   ❌ Health check failed: ${health.status}`, 'error');
        if (health.error) log(`      Error: ${health.error}`, 'error');
        console.log('\n⚠️  Ensure the server is running with: npm run dev');
        return;
    }

    // 2. Authentication Flow
    log('\n2️⃣  Testing Authentication...', 'info');

    // Register
    const testUser = {
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!',
        fullName: 'Test User'
    };

    log(`   Registering user: ${testUser.username}...`, 'info');
    const register = await request(`${API_URL}/auth/register`, 'POST', testUser);

    if (register.status === 201 && register.data.success) {
        log('   ✅ Registration successful', 'success');
        authToken = register.data.token;
        userId = register.data.user._id;
    } else {
        log(`   ❌ Registration failed: ${register.status}`, 'error');
        console.log(register.data);
        return;
    }

    // Login
    log('   Testing Login...', 'info');
    const login = await request(`${API_URL}/auth/login`, 'POST', {
        emailOrUsername: testUser.email,
        password: testUser.password
    });

    if (login.status === 200 && login.data.success) {
        log('   ✅ Login successful', 'success');
        authToken = login.data.token; // Update token
    } else {
        log(`   ❌ Login failed: ${login.status}`, 'error');
    }

    // Get Current User
    log('   Verifying Token (Get Me)...', 'info');
    const me = await request(`${API_URL}/auth/me`, 'GET', null, authToken);

    if (me.status === 200 && me.data.success) {
        log('   ✅ Token verification successful', 'success');
    } else {
        log(`   ❌ Token verification failed: ${me.status}`, 'error');
    }

    // 3. User Management
    log('\n3️⃣  Testing User Management...', 'info');

    // Update Profile
    log('   Updating Profile...', 'info');
    const update = await request(`${API_URL}/users/profile`, 'PUT', {
        bio: 'This is a test bio',
        website: 'https://example.com'
    }, authToken);

    if (update.status === 200 && update.data.user.bio === 'This is a test bio') {
        log('   ✅ Profile update successful', 'success');
    } else {
        log(`   ❌ Profile update failed: ${update.status}`, 'error');
    }

    // Search Users
    log('   Searching Users...', 'info');
    const search = await request(`${API_URL}/users/search?q=${testUser.username}`, 'GET', null, authToken);

    if (search.status === 200 && search.data.users.length > 0) {
        log('   ✅ Search successful', 'success');
    } else {
        log(`   ❌ Search failed or empty: ${search.status}`, 'error');
    }

    // 4. Post Management (Limited without Cloudinary)
    log('\n4️⃣  Testing Post Management...', 'info');
    log('   ⚠️  Skipping image upload test (requires valid Cloudinary credentials)', 'warning');

    // We can test fetching feed even if empty
    log('   Fetching Feed...', 'info');
    const feed = await request(`${API_URL}/posts/feed`, 'GET', null, authToken);

    if (feed.status === 200) {
        log('   ✅ Feed fetch successful', 'success');
    } else {
        log(`   ❌ Feed fetch failed: ${feed.status}`, 'error');
    }

    log('\n----------------------------------------');
    log('✅ API Verification Complete!', 'success');
    log('Note: Full post creation and image upload tests require valid Cloudinary credentials in .env', 'warning');
}

runTests().catch(err => {
    console.error('Test script error:', err);
});
