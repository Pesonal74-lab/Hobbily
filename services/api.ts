import axios from "axios";

/**
 * Central Axios instance
 * Makes it easy to reuse configuration across APIs
 */
export const api = axios.create({
  timeout: 10000, // prevent hanging requests
});
