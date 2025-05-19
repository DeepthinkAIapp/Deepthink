// Add this TypeScript declaration for Vite env variables
/// <reference types="vite/client" />

// API Configuration
export const API_CONFIG = {
  // Use Vite environment variable for API URL
  BASE_URL: import.meta.env.VITE_API_URL || 'https://3c0a-2601-681-8400-6350-e56a-a571-bd45-4b51.ngrok-free.app',
  // API endpoints
  CHAT: '/api/chat',
  GENERATE: '/api/generate',
  MONETIZE: '/api/monetize',
  GUEST_POST: '/api/guestpost',
  SEARCH_INTENT: '/api/search-intent',
  IMAGE_GENERATOR: '/api/generate-image',
  GENERATED_IMAGES: '/api/generated-images',
  CHAT_HISTORY: '/api/chat/history',
  HEALTH: '/health',
  AUTHORITY_CHECKER: '/api/authority-checker'
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