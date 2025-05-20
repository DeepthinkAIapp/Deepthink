// Add this TypeScript declaration for Vite env variables
/// <reference types="vite/client" />

// API Configuration
export const API_CONFIG = {
  // Use Vite environment variable for API URL or fallback to ngrok URL
  BASE_URL: import.meta.env.VITE_API_URL || 'https://19a8-2601-681-8400-6350-d929-445-fd8e-ef3f.ngrok-free.app',
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
  AUTHORITY_CHECKER: '/api/authority-checker',
  // Stable Diffusion endpoints
  SD_BASE_URL: 'http://127.0.0.1:7861',
  SD_TXT2IMG: '/sdapi/v1/txt2img',
  SD_IMG2IMG: '/sdapi/v1/img2img',
  SD_DEFORUM: '/deforum_api',
  // Default fetch options
  DEFAULT_FETCH_OPTIONS: {
    credentials: 'include' as RequestCredentials,
    headers: {
      'Content-Type': 'application/json',
    },
  }
};

// Helper function to get the full API URL for a specific endpoint
export const getApiUrl = (endpoint: string) => {
  const baseUrl = API_CONFIG.BASE_URL;
  return `${baseUrl}${endpoint}`;
};

// Helper function to get the full Stable Diffusion API URL
export const getSdApiUrl = (endpoint: string) => {
  return `${API_CONFIG.SD_BASE_URL}${endpoint}`;
};

// Helper function to check if the API is available
export const checkApiHealth = async () => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.HEALTH), {
      ...API_CONFIG.DEFAULT_FETCH_OPTIONS,
      method: 'GET',
    });
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