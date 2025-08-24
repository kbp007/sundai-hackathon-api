// API configuration for different environments
const API_CONFIG = {
  development: 'http://localhost:3001',
  production: process.env.REACT_APP_API_URL || 'https://sundai-api-backend.onrender.com'
};

export const API_BASE_URL = API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;

export const API_ENDPOINTS = {
  // Auth endpoints
  login: '/api/auth/login',
  register: '/api/auth/register',
  profile: '/api/auth/profile',
  
  // Profile endpoints
  updateProfile: '/api/profiles',
  
  // API Keys endpoints
  generateKey: '/api/keys/generate',
  listKeys: '/api/keys/list',
  revokeKey: '/api/keys',
  
  // Public endpoints
  participants: '/api/public/participants',
  stats: '/api/public/stats',
  docs: '/api/public/docs',
  
  // Matching endpoints
  aiMatches: '/api/matching/ai-matches',
  teamRecommendations: '/api/matching/team-recommendations'
};

export default API_BASE_URL; 