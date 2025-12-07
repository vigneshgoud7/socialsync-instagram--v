// Text processing utilities for frontend

/**
 * Linkify hashtags and mentions in text
 */
function linkifyText(text) {
    if (!text) return '';

    // First escape HTML to prevent XSS
    let processed = escapeHtml(text);

    // Make hashtags clickable
    processed = processed.replace(/#([a-zA-Z0-9_]+)/g,
        '<span class="hashtag" onclick="navigateToHashtag(\'$1\')">#$1</span>');

    // Make mentions clickable  
    processed = processed.replace(/@([a-zA-Z0-9_.]+)/g,
        '<span class="mention" onclick="navigateToProfile(\'$1\')">@$1</span>');

    // Preserve line breaks
    processed = processed.replace(/\n/g, '<br>');

    return processed;
}

/**
 * Navigate to hashtag page
 */
function navigateToHashtag(tag) {
    window.location.hash = `#/hashtag/${tag}`;
}

/**
 * Navigate to user profile
 */
function navigateToProfile(username) {
    window.location.hash = `#/profile/${username}`;
}

/**
 * Extract hashtags from text for autocomplete
 */
function extractHashtagsFromText(text) {
    if (!text) return [];
    const matches = text.match(/#([a-zA-Z0-9_]+)/g);
    return matches ? matches.map(tag => tag.slice(1)) : [];
}

/**
 * Extract mentions from text for autocomplete
 */
function extractMentionsFromText(text) {
    if (!text) return [];
    const matches = text.match(/@([a-zA-Z0-9_.]+)/g);
    return matches ? matches.map(mention => mention.slice(1)) : [];
}

/**
 * Get activity status text
 */
function getActivityStatus(lastActive, showStatus = true) {
    if (!showStatus || !lastActive) return null;

    const now = Date.now();
    const then = new Date(lastActive).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Active ${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Active ${diffDays}d ago`;

    return null;
}
