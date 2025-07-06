// Polyfills for viem/wagmi compatibility in production builds
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  
  // Additional polyfills for Node.js modules
  if (!(window as any).global) {
    (window as any).global = window;
  }
  
  // Polyfill for process
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
  
  // Polyfill for crypto if not available
  if (!(window as any).crypto) {
    (window as any).crypto = {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }
    };
  }
}

// Export for use in other files if needed
export { Buffer }; 