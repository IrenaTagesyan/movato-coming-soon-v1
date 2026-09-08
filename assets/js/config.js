/**
 * Deployment config.
 *
 * API_BASE_URL is the origin the subscription form posts to. The form sends
 * POST {API_BASE_URL}/v1/user-subscriptions — set this to your API's origin
 * (no trailing slash), or leave it empty to post to the page's own origin.
 */
const API_BASE_URL = '';

/** Path appended to API_BASE_URL for the email subscription endpoint. */
const SUBSCRIBE_PATH = '/v1/user-subscriptions';
