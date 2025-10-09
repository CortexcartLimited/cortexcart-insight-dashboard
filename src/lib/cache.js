// src/lib/cache.js

// A simple in-memory cache with a Time-To-Live (TTL)
const cache = new Map();

/**
 * Retrieves a value from the cache.
 * @param {string} key The cache key.
 * @returns {any | null} The cached value or null if it's expired or doesn't exist.
 */
function get(key) {
    const entry = cache.get(key);
    if (entry) {
        // Check if the cache entry has expired
        if (entry.expiry > Date.now()) {
            return entry.value;
        } else {
            // Delete the expired entry
            cache.delete(key);
        }
    }
    return null;
}

/**
 * Stores a value in the cache.
 * @param {string} key The cache key.
 * @param {any} value The value to store.
 * @param {number} ttlInSeconds The time-to-live for the cache entry in seconds.
 */
function set(key, value, ttlInSeconds) {
    const expiry = Date.now() + ttlInSeconds * 1000;
    cache.set(key, { value, expiry });
}

export const simpleCache = { get, set };
