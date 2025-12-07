// Utility functions for extracting hashtags and mentions from text

/**
 * Extract hashtags from text
 * @param {string} text - The text to extract hashtags from
 * @returns {Array<string>} - Array of hashtags (without #)
 */
function extractHashtags(text) {
    if (!text) return [];

    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);

    if (!matches) return [];

    // Remove # and convert to lowercase, remove duplicates
    return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

/**
 * Extract mentions from text
 * @param {string} text - The text to extract mentions from
 * @returns {Array<string>} - Array of usernames (without @)
 */
function extractMentions(text) {
    if (!text) return [];

    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const matches = text.match(mentionRegex);

    if (!matches) return [];

    // Remove @ and convert to lowercase, remove duplicates
    return [...new Set(matches.map(mention => mention.slice(1).toLowerCase()))];
}

/**
 * Make hashtags clickable in text
 * @param {string} text - The text to process
 * @returns {string} - Text with clickable hashtag spans
 */
function linkifyHashtags(text) {
    if (!text) return '';

    return text.replace(/#([a-zA-Z0-9_]+)/g,
        '<span class="hashtag" data-tag="$1">#$1</span>');
}

/**
 * Make mentions clickable in text  
 * @param {string} text - The text to process
 * @returns {string} - Text with clickable mention spans
 */
function linkifyMentions(text) {
    if (!text) return '';

    return text.replace(/@([a-zA-Z0-9_.]+)/g,
        '<span class="mention" data-username="$1">@$1</span>');
}

/**
 * Process text with both hashtags and mentions
 * @param {string} text - The text to process
 * @returns {string} - Text with clickable hashtags and mentions
 */
function linkifyText(text) {
    if (!text) return '';

    let processed = linkifyHashtags(text);
    processed = linkifyMentions(processed);

    return processed;
}

/**
 * Get time ago string for activity status
 * @param {Date} date - The date to compare
 * @returns {string} - Human readable time ago string
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

    return null; // Don't show if more than a week
}

module.exports = {
    extractHashtags,
    extractMentions,
    linkifyHashtags,
    linkifyMentions,
    linkifyText,
    getActivityStatus
};
