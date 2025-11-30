const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

const criticalFiles = [
    'backend/server.js',
    'backend/config/database.js',
    'backend/config/cloudinary.js',
    'backend/models/User.js',
    'backend/models/Post.js',
    'backend/middleware/auth.js',
    'backend/middleware/upload.js',
    'backend/routes/auth.js',
    'backend/routes/users.js',
    'backend/routes/posts.js',
    'frontend/index.html',
    'frontend/css/main.css',
    'frontend/css/components.css',
    'frontend/js/app.js',
    'frontend/js/api.js',
    'frontend/js/auth.js',
    'frontend/js/router.js',
    'frontend/js/utils/helpers.js',
    'frontend/js/utils/toast.js'
];

console.log('🔍 Starting Integrity Check...\n');

let missingFiles = 0;
let syntaxErrors = 0;

// 1. Check File Existence
console.log('1️⃣  Checking Critical Files:');
criticalFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
            console.log(`  ✅ [OK] ${file}`);
        } else {
            console.log(`  ❌ [EMPTY] ${file}`);
            missingFiles++;
        }
    } else {
        console.log(`  ❌ [MISSING] ${file}`);
        missingFiles++;
    }
});

// 2. Check Backend Syntax (by attempting to require)
console.log('\n2️⃣  Checking Backend Syntax:');
const backendFiles = criticalFiles.filter(f => f.startsWith('backend/') && f.endsWith('.js'));

backendFiles.forEach(file => {
    try {
        const filePath = path.join(rootDir, file);
        // We don't actually run the server, just check if it parses
        // We use fs.readFileSync to check for syntax errors without executing
        const content = fs.readFileSync(filePath, 'utf8');
        new Function(content); // This will throw if there's a syntax error
        console.log(`  ✅ [SYNTAX OK] ${file}`);
    } catch (error) {
        console.error(`  ❌ [SYNTAX ERROR] ${file}: ${error.message}`);
        syntaxErrors++;
    }
});

console.log('\n----------------------------------------');
console.log(`Integrity Check Complete.`);
console.log(`Missing/Empty Files: ${missingFiles}`);
console.log(`Syntax Errors: ${syntaxErrors}`);

if (missingFiles === 0 && syntaxErrors === 0) {
    console.log('\n✅ SUCCESS: Project structure looks good!');
    process.exit(0);
} else {
    console.log('\n❌ FAILURE: Issues found.');
    process.exit(1);
}
