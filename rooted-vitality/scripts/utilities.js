/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: utilities.js                                                ║
║  Purpose: Global utility functions (formatting, validation, etc.)  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. TIME & DATE FORMATTING
   2. HTML ESCAPING & SECURITY
   3. FILE SIZE FORMATTING
   4. PHONE NUMBER FORMATTING
   5. GENERAL HELPERS & UTILITIES
*/

// ======================================================
// 1. TIME & DATE FORMATTING
// ======================================================

/**
 * Format timestamp relative to current time
 * Supports both Date objects and ISO timestamp strings
 * @param {Date|string} dateOrTimestamp - Date object or ISO timestamp string
 * @returns {string} Formatted time (e.g., "now", "5m", "2h", "3d", "Nov 29")
 */
function formatTime(dateOrTimestamp) {
    // Handle null/undefined
    if (!dateOrTimestamp) return '';
    
    // Convert string timestamp to Date object if needed
    const date = typeof dateOrTimestamp === 'string' ? new Date(dateOrTimestamp) : dateOrTimestamp;
    
    // Validate date
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Escape HTML special characters to prevent XSS vulnerabilities
 * Uses character map replacement for comprehensive protection
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format phone number to readable format
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number (e.g., "1-555-123-4567")
 */
function formatPhoneNumber(phone) {
    if (!phone) return 'No phone on file';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
    }
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
    }
    return phone;
}

/**
 * Format practitioner name by replacing underscores with spaces
 * @param {string} name - Name with underscores
 * @returns {string} Formatted name
 */
function formatPractitionerName(name) {
    if (!name) return 'Practitioner';
    return name.replace(/_/g, ' ');
}

/**
 * Convert 24-hour time to 12-hour format
 * @param {string} time24 - Time in 24-hour format (e.g., "0900" or "09:00")
 * @returns {string} Time in 12-hour format (e.g., "9:00 AM")
 */
function convertTo12Hour(time24) {
    if (!time24) return '';
    const cleanTime = time24.replace(/\D/g, '').padStart(4, '0');
    const hours = parseInt(cleanTime.substring(0, 2), 10);
    const minutes = cleanTime.substring(2, 4);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
}

/**
 * Format date as relative time (e.g., "2 days ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
function formatRelativeDate(date) {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffDays = Math.floor((now - reviewDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return reviewDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get time ago string with granular precision
 * @param {Date} date - Date to compare
 * @returns {string} Time ago string (e.g., "5 minutes ago")
 */
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
        return date.toLocaleDateString();
    } else if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'info', 'success', 'error', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Create toast container if it doesn't exist
 * @returns {HTMLElement} Toast container element
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(container);
    return container;
}