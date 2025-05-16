// Add this TypeScript declaration for Vite env variables
/// <reference types="vite/client" />

// API Configuration
export const API_CONFIG = {
  // Use Vite environment variable for API URL
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  // API endpoints
  CHAT: '/api/chat',
  GENERATE: '/api/generate',
  MONETIZE: '/api/monetize',
  GUEST_POST: '/api/guestpost',
  SEARCH_INTENT: '/api/search-intent',
  IMAGE_GENERATOR: '/api/generate-image',
  GENERATED_IMAGES: '/api/generated-images',
  CHAT_HISTORY: '/api/chat/history',
  HEALTH: '/health'
};

// Helper function to get the full API URL for a specific endpoint
export const getApiUrl = (endpoint: string) => {
  const baseUrl = API_CONFIG.BASE_URL;
  return `${baseUrl}${endpoint}`;
};

// Helper function to check if the API is available
export const checkApiHealth = async () => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.HEALTH));
    if (!response.ok) {
      console.error('API health check failed:', response.status, response.statusText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}; 