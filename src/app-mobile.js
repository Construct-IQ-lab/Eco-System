/**
 * Mobile App Initialization
 * Main entry point for the Capacitor mobile app with offline sync
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import offlineSync from './offline-sync.js';
import networkMonitor from './network-monitor.js';
import syncUI from './sync-ui.js';

class MobileApp {
  constructor() {
    this.isInitialized = false;
    this.authToken = null;
    this.syncInProgress = false;
    this.syncRetryCount = 0;
    this.maxRetries = 3;
    this.retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff
  }

  /**
   * Initialize the mobile app
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[MobileApp] Already initialized');
      return;
    }

    try {
      console.log('[MobileApp] Initializing...');
      console.log('[MobileApp] Platform:', Capacitor.getPlatform());
      console.log('[MobileApp] Native:', Capacitor.isNativePlatform());

      // Initialize offline sync database
      await offlineSync.initialize();

      // Initialize network monitoring
      await networkMonitor.initialize();

      // Set up network status listener
      networkMonitor.addListener((status) => {
        this.handleNetworkChange(status);
      });

      // Set up auto-sync when connection is restored
      networkMonitor.onConnectionRestored(() => {
        this.performAutoSync();
      });

      // Set up sync notifications from offline sync
      offlineSync.onSyncNeeded((reason) => {
        console.log('[MobileApp] Sync needed:', reason);
        this.updateSyncStatus();
      });

      // Load auth token
      await this.loadAuthToken();

      // Update initial sync status
      await this.updateSyncStatus();

      // Set up app lifecycle listeners
      this.setupAppLifecycle();

      // Perform initial sync if online
      if (networkMonitor.getStatus().online && this.authToken) {
        await this.performSync();
      }

      this.isInitialized = true;
      console.log('[MobileApp] Initialization complete');
    } catch (error) {
      console.error('[MobileApp] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle network status changes
   */
  handleNetworkChange(status) {
    console.log('[MobileApp] Network status changed:', status);
    this.updateSyncStatus();
  }

  /**
   * Update sync status UI
   */
  async updateSyncStatus() {
    try {
      const networkStatus = networkMonitor.getStatus();
      const pendingCount = await offlineSync.getPendingSyncCount();
      
      let status;
      if (this.syncInProgress) {
        status = 'syncing';
      } else if (!networkStatus.online) {
        status = 'offline';
      } else if (pendingCount.total === 0) {
        status = 'online-synced';
      } else {
        status = 'online';
      }

      syncUI.updateStatus(status, {
        pendingCount: pendingCount.total,
        lastSync: this.lastSyncTime,
        isSyncing: this.syncInProgress
      });
    } catch (error) {
      console.error('[MobileApp] Error updating sync status:', error);
    }
  }

  /**
   * Perform automatic sync
   */
  async performAutoSync() {
    if (this.syncInProgress) {
      console.log('[MobileApp] Sync already in progress');
      return;
    }

    console.log('[MobileApp] Auto-sync triggered');
    await this.performSync();
  }

  /**
   * Perform manual sync (triggered by user)
   */
  async performManualSync() {
    if (this.syncInProgress) {
      syncUI.showNotification('Sync already in progress', 'info');
      return;
    }

    if (!networkMonitor.getStatus().online) {
      syncUI.showNotification('Cannot sync while offline', 'error');
      return;
    }

    if (!this.authToken) {
      syncUI.showNotification('Please log in to sync', 'error');
      return;
    }

    console.log('[MobileApp] Manual sync triggered');
    await this.performSync();
  }

  /**
   * Perform sync operation
   */
  async performSync() {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    await this.updateSyncStatus();

    try {
      console.log('[MobileApp] Starting sync...');
      syncUI.showSyncProgress('Syncing data...');

      // Get pending items
      const pendingAudits = await offlineSync.getPendingAudits();
      console.log(`[MobileApp] Found ${pendingAudits.length} pending audits`);

      // Sync audits
      for (const audit of pendingAudits) {
        await this.syncAudit(audit);
      }

      // Fetch latest data from server
      await this.fetchSchedules();
      await this.fetchJobCards();
      await this.fetchEarnings();

      this.lastSyncTime = Date.now();
      this.syncRetryCount = 0;

      syncUI.showSyncSuccess('All data synced successfully');
      console.log('[MobileApp] Sync completed successfully');
    } catch (error) {
      console.error('[MobileApp] Sync failed:', error);
      syncUI.showSyncError('Sync failed', error);
      
      // Retry with exponential backoff
      if (this.syncRetryCount < this.maxRetries) {
        const delay = this.retryDelays[this.syncRetryCount];
        this.syncRetryCount++;
        console.log(`[MobileApp] Retrying sync in ${delay}ms (attempt ${this.syncRetryCount}/${this.maxRetries})`);
        setTimeout(() => this.performSync(), delay);
      }
    } finally {
      this.syncInProgress = false;
      await this.updateSyncStatus();
    }
  }

  /**
   * Sync a single audit to the server
   */
  async syncAudit(audit) {
    try {
      console.log(`[MobileApp] Syncing audit ${audit.id}...`);

      // Upload photos first if any
      const photoUrls = [];
      if (audit.photos && audit.photos.length > 0) {
        for (const photo of audit.photos) {
          const url = await this.uploadPhoto(photo);
          photoUrls.push(url);
        }
      }

      // Send audit data to server
      const response = await this.apiRequest('/api/mobile/sync/audits', 'POST', {
        title: audit.title,
        notes: audit.notes,
        photos: photoUrls,
        created_at: audit.created_at
      });

      // Update local status
      await offlineSync.updateAuditSyncStatus(audit.id, 'synced', response.id);
      console.log(`[MobileApp] Audit ${audit.id} synced successfully`);
    } catch (error) {
      console.error(`[MobileApp] Failed to sync audit ${audit.id}:`, error);
      await offlineSync.updateAuditSyncStatus(audit.id, 'error', null, error.message);
      throw error;
    }
  }

  /**
   * Upload a photo to the server
   */
  async uploadPhoto(photoData) {
    try {
      console.log('[MobileApp] Uploading photo...');
      
      const response = await this.apiRequest('/api/mobile/uploads', 'POST', {
        photo: photoData.dataUrl,
        timestamp: photoData.timestamp
      });

      console.log('[MobileApp] Photo uploaded successfully');
      return response.url;
    } catch (error) {
      console.error('[MobileApp] Photo upload failed:', error);
      throw error;
    }
  }

  /**
   * Fetch schedules from server
   */
  async fetchSchedules() {
    try {
      console.log('[MobileApp] Fetching schedules...');
      
      const response = await this.apiRequest('/api/mobile/user/schedule', 'GET');
      await offlineSync.cacheSchedules(response.schedules);
      
      console.log(`[MobileApp] Cached ${response.schedules.length} schedules`);
    } catch (error) {
      console.error('[MobileApp] Failed to fetch schedules:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Fetch job cards from server
   */
  async fetchJobCards() {
    try {
      console.log('[MobileApp] Fetching job cards...');
      
      const response = await this.apiRequest('/api/mobile/user/job-cards', 'GET');
      await offlineSync.cacheJobCards(response.jobCards);
      
      console.log(`[MobileApp] Cached ${response.jobCards.length} job cards`);
    } catch (error) {
      console.error('[MobileApp] Failed to fetch job cards:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Fetch earnings from server
   */
  async fetchEarnings() {
    try {
      console.log('[MobileApp] Fetching earnings...');
      
      const response = await this.apiRequest('/api/mobile/user/earnings', 'GET');
      await offlineSync.cacheEarnings(response.earnings);
      
      console.log(`[MobileApp] Cached ${response.earnings.length} earnings`);
    } catch (error) {
      console.error('[MobileApp] Failed to fetch earnings:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Make an API request
   * 
   * IMPORTANT: This is a MOCK/DEMO implementation!
   * Replace with actual API implementation before production use.
   * See API_INTEGRATION.md for detailed implementation guide.
   */
  async apiRequest(endpoint, method = 'GET', data = null) {
    console.warn('[MobileApp] Using MOCK API - Replace with production API endpoint');
    console.log(`[MobileApp] MOCK API ${method} ${endpoint}`, data);
    
    // TODO: Replace with actual implementation:
    // const API_BASE = 'https://api.yourcompany.com';
    // const response = await fetch(API_BASE + endpoint, {
    //   method,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${this.authToken}`
    //   },
    //   body: data ? JSON.stringify(data) : null
    // });
    // return response.json();
    
    // MOCK: Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // MOCK: Simulate successful response
    return {
      success: true,
      id: Math.floor(Math.random() * 10000),
      schedules: [],
      jobCards: [],
      earnings: [],
      url: 'https://example.com/uploads/photo.jpg'
    };
  }

  /**
   * Load authentication token from secure storage
   */
  async loadAuthToken() {
    try {
      const { value } = await Preferences.get({ key: 'authToken' });
      this.authToken = value;
      console.log('[MobileApp] Auth token loaded:', this.authToken ? 'Yes' : 'No');
    } catch (error) {
      console.error('[MobileApp] Error loading auth token:', error);
    }
  }

  /**
   * Save authentication token to secure storage
   */
  async saveAuthToken(token) {
    try {
      await Preferences.set({
        key: 'authToken',
        value: token
      });
      this.authToken = token;
      console.log('[MobileApp] Auth token saved');
    } catch (error) {
      console.error('[MobileApp] Error saving auth token:', error);
    }
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken() {
    try {
      await Preferences.remove({ key: 'authToken' });
      this.authToken = null;
      console.log('[MobileApp] Auth token cleared');
    } catch (error) {
      console.error('[MobileApp] Error clearing auth token:', error);
    }
  }

  /**
   * Set up app lifecycle listeners
   */
  setupAppLifecycle() {
    if (!Capacitor.isNativePlatform()) {
      console.log('[MobileApp] Not on native platform, skipping lifecycle setup');
      return;
    }

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('[MobileApp] App state changed:', isActive ? 'Active' : 'Background');
      
      if (isActive && networkMonitor.getStatus().online) {
        // App came to foreground and we're online - sync
        this.performAutoSync();
      }
    });

    // Handle app URL open (deep linking)
    App.addListener('appUrlOpen', (data) => {
      console.log('[MobileApp] App opened with URL:', data.url);
      // Handle deep linking here
    });

    console.log('[MobileApp] App lifecycle listeners registered');
  }

  /**
   * Get app information
   */
  async getAppInfo() {
    try {
      const info = await App.getInfo();
      console.log('[MobileApp] App info:', info);
      return info;
    } catch (error) {
      console.error('[MobileApp] Error getting app info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const mobileApp = new MobileApp();
export default mobileApp;
