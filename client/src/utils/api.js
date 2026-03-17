/**
 * API Configuration
 *
 * In development:
 * - Vite dev server runs on port 8844
 * - Vite proxy forwards /api/* to localhost:3001
 * - Relative URLs work: fetch('/api/chat')
 *
 * In production:
 * - Caddy reverse proxy handles routing
 * - /api/* requests proxied to localhost:3001 by Caddy
 * - Use relative URLs (same as development)
 */

// Get API base URL from environment or construct it
export function getApiUrl(endpoint) {
  const apiUrl = import.meta.env.VITE_API_URL;

  // Safety check: If PROD and apiUrl points to localhost, ignore it and use relative path
  // This prevents the "local network" error if someone accidentally left the env var set
  if (import.meta.env.PROD && apiUrl && (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1"))) {
    console.warn("Ignoring VITE_API_URL pointing to localhost in production build. Using relative path.");
    return endpoint;
  }

  // If VITE_API_URL is explicitly set, use it (for custom deployments)
  if (apiUrl) {
    return `${apiUrl}${endpoint}`;
  }

  // Default: use relative URLs
  // Works in development (Vite proxy) and production (Caddy proxy)
  return endpoint;
}

/**
 * Fetch wrapper that automatically uses correct API URL
 * @param {string} endpoint - API endpoint path (e.g., '/api/chat')
 * @param {RequestInit} options - Fetch options (method, headers, body, signal, etc.)
 * @param {number|null} timeoutMs - Optional timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
export async function apiFetch(endpoint, options = {}, timeoutMs = null) {
  const url = getApiUrl(endpoint);

  // If timeout is specified and no signal is already provided, add one
  if (timeoutMs && !options.signal) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  return fetch(url, options);
}
