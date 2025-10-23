import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68c454689023af7be794a4cf", 
  requiresAuth: true // Ensure authentication is required for all operations
});
