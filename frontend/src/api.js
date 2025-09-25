import axios from 'axios';

// API base URL - environment var or hardcoded
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

/**
 * @typedef {Object} Activity
 * @property {number} index
 * @property {string} name
 * @property {string|null} start // ISO string or null
 * @property {string|null} end   // ISO string or null
 * @property {number|null} durationDays
 */

/**
 * @typedef {Object} Node
 * @property {string} id
 * @property {string} name
 * @property {number} value
 */

/**
 * @typedef {Object} Link
 * @property {string} source
 * @property {string} target
 */

/**
 * @typedef {Object} Network
 * @property {Node[]} nodes
 * @property {Link[]} links
 */

/**
 * @typedef {Object} ActiveCount
 * @property {string} date // YYYY-MM-DD
 * @property {number} count
 */

/**
 * Fetches activity data for the timeline chart
 * @returns {Promise<{ ok: boolean, activities: Activity[] }>}
 */
export async function getActivities() { 
  return axios.get(API_BASE + '/activities').then(r => r.data); 
  // TODO: Add retry logic for failed requests
}

/**
 * Fetches network graph data for the network graph chart
 * @returns {Promise<Network>}
 */
export async function getNetwork() { 
  return axios.get(API_BASE + '/network').then(r => r.data); 
}

/**
 * Fetches daily activity counts for the active line chart
 * @returns {Promise<{ ok: boolean, counts: ActiveCount[] }>}
 */
export async function getCounts() { 
  return axios.get(API_BASE + '/active-counts').then(r => r.data); 
}
