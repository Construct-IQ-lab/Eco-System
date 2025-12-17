/**
 * Network Monitor
 * Tracks network status and triggers auto-sync when connection is restored
 */

import { Network } from '@capacitor/network';

class NetworkMonitor {
  constructor() {
    this.isOnline = true;
    this.listeners = [];
    this.syncTriggers = [];
    this.isListening = false;
  }

  /**
   * Initialize network monitoring
   */
  async initialize() {
    if (this.isListening) {
      return;
    }

    try {
      // Get initial network status
      const status = await Network.getStatus();
      this.isOnline = status.connected;
      console.log('[NetworkMonitor] Initial network status:', this.isOnline ? 'Online' : 'Offline');

      // Listen for network status changes
      Network.addListener('networkStatusChange', (status) => {
        this.handleNetworkChange(status);
      });

      this.isListening = true;
      console.log('[NetworkMonitor] Network monitoring started');
    } catch (error) {
      console.error('[NetworkMonitor] Failed to initialize:', error);
      // Assume online if network plugin not available
      this.isOnline = true;
    }
  }

  /**
   * Handle network status change
   */
  handleNetworkChange(status) {
    const wasOnline = this.isOnline;
    this.isOnline = status.connected;

    console.log('[NetworkMonitor] Network status changed:', {
      from: wasOnline ? 'Online' : 'Offline',
      to: this.isOnline ? 'Online' : 'Offline',
      connectionType: status.connectionType
    });

    // Notify all listeners
    this.notifyListeners(status);

    // Trigger auto-sync if we just came back online
    if (!wasOnline && this.isOnline) {
      console.log('[NetworkMonitor] Connection restored - triggering auto-sync');
      this.triggerSync();
    }
  }

  /**
   * Check current network status
   */
  async checkStatus() {
    try {
      const status = await Network.getStatus();
      this.isOnline = status.connected;
      return status;
    } catch (error) {
      console.error('[NetworkMonitor] Error checking network status:', error);
      return { connected: this.isOnline };
    }
  }

  /**
   * Get current online status
   */
  getStatus() {
    return {
      online: this.isOnline,
      offline: !this.isOnline
    };
  }

  /**
   * Register a listener for network status changes
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all registered listeners
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback({
          online: status.connected,
          offline: !status.connected,
          connectionType: status.connectionType
        });
      } catch (error) {
        console.error('[NetworkMonitor] Error in listener callback:', error);
      }
    });
  }

  /**
   * Register a sync trigger function
   */
  onConnectionRestored(callback) {
    this.syncTriggers.push(callback);
    return () => {
      this.syncTriggers = this.syncTriggers.filter(cb => cb !== callback);
    };
  }

  /**
   * Trigger all registered sync functions
   */
  triggerSync() {
    this.syncTriggers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[NetworkMonitor] Error in sync trigger:', error);
      }
    });
  }

  /**
   * Stop monitoring
   */
  async stop() {
    try {
      await Network.removeAllListeners();
      this.isListening = false;
      console.log('[NetworkMonitor] Network monitoring stopped');
    } catch (error) {
      console.error('[NetworkMonitor] Error stopping network monitor:', error);
    }
  }
}

// Export singleton instance
export const networkMonitor = new NetworkMonitor();
export default networkMonitor;
