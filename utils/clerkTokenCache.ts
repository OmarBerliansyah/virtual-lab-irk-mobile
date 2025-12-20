import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/clerk-expo';

const key = 'clerk-token-cache';

export const tokenCache: TokenCache = {
  async getToken(cacheKey) {
    try {
      return await SecureStore.getItemAsync(`${key}-${cacheKey}`);
    } catch (error) {
      console.warn('Failed to get token from SecureStore', error);
      return null;
    }
  },
  async saveToken(cacheKey, token) {
    try {
      await SecureStore.setItemAsync(`${key}-${cacheKey}`, token);
    } catch (error) {
      console.warn('Failed to save token to SecureStore', error);
    }
  },
  async clearToken(cacheKey) {
    try {
      await SecureStore.deleteItemAsync(`${key}-${cacheKey}`);
    } catch (error) {
      console.warn('Failed to clear token from SecureStore', error);
    }
  },
};
