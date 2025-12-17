/**
 * Sync UI Components
 * UI helpers for displaying sync status and manual sync controls
 */

class SyncUI {
  constructor() {
    this.statusElement = null;
    this.pendingCountElement = null;
    this.lastSyncElement = null;
    this.syncButtonElement = null;
    this.currentStatus = 'offline';
    this.pendingCount = 0;
    this.lastSyncTime = null;
    this.isSyncing = false;
  }

  /**
   * Initialize UI components
   */
  initialize(options = {}) {
    this.statusElement = options.statusElement || document.getElementById('sync-status');
    this.pendingCountElement = options.pendingCountElement || document.getElementById('pending-count');
    this.lastSyncElement = options.lastSyncElement || document.getElementById('last-sync');
    this.syncButtonElement = options.syncButtonElement || document.getElementById('sync-button');

    if (this.syncButtonElement) {
      this.syncButtonElement.addEventListener('click', () => {
        if (this.onSyncClick) {
          this.onSyncClick();
        }
      });
    }

    console.log('[SyncUI] UI components initialized');
  }

  /**
   * Update network and sync status
   * States: online-synced, syncing, offline, error
   */
  updateStatus(status, options = {}) {
    this.currentStatus = status;
    
    if (options.pendingCount !== undefined) {
      this.pendingCount = options.pendingCount;
    }
    
    if (options.lastSync !== undefined) {
      this.lastSyncTime = options.lastSync;
    }
    
    if (options.isSyncing !== undefined) {
      this.isSyncing = options.isSyncing;
    }

    this.render();
  }

  /**
   * Render the current status
   */
  render() {
    if (this.statusElement) {
      const statusInfo = this.getStatusInfo();
      this.statusElement.innerHTML = `
        <span class="status-indicator ${statusInfo.class}">
          ${statusInfo.icon} ${statusInfo.text}
        </span>
      `;
      this.statusElement.className = `sync-status ${statusInfo.class}`;
    }

    if (this.pendingCountElement) {
      if (this.pendingCount > 0) {
        this.pendingCountElement.textContent = `${this.pendingCount} pending`;
        this.pendingCountElement.style.display = 'inline';
      } else {
        this.pendingCountElement.textContent = '';
        this.pendingCountElement.style.display = 'none';
      }
    }

    if (this.lastSyncElement && this.lastSyncTime) {
      this.lastSyncElement.textContent = `Last synced: ${this.formatTimestamp(this.lastSyncTime)}`;
      this.lastSyncElement.style.display = 'block';
    } else if (this.lastSyncElement) {
      this.lastSyncElement.textContent = 'Never synced';
      this.lastSyncElement.style.display = 'block';
    }

    if (this.syncButtonElement) {
      this.syncButtonElement.disabled = this.isSyncing || this.currentStatus === 'offline';
      this.syncButtonElement.textContent = this.isSyncing ? 'Syncing...' : 'Sync Now';
    }
  }

  /**
   * Get status information for rendering
   */
  getStatusInfo() {
    if (this.isSyncing) {
      return {
        icon: '🟡',
        text: 'Syncing',
        class: 'status-syncing'
      };
    }

    switch (this.currentStatus) {
      case 'online-synced':
        return {
          icon: '🟢',
          text: 'Online & Synced',
          class: 'status-online'
        };
      case 'online':
        if (this.pendingCount > 0) {
          return {
            icon: '🟡',
            text: `Online (${this.pendingCount} pending)`,
            class: 'status-pending'
          };
        }
        return {
          icon: '🟢',
          text: 'Online',
          class: 'status-online'
        };
      case 'offline':
        if (this.pendingCount > 0) {
          return {
            icon: '🔴',
            text: `Offline (${this.pendingCount} pending)`,
            class: 'status-offline'
          };
        }
        return {
          icon: '🔴',
          text: 'Offline',
          class: 'status-offline'
        };
      case 'error':
        return {
          icon: '⚠️',
          text: 'Sync Error',
          class: 'status-error'
        };
      default:
        return {
          icon: '🔴',
          text: 'Unknown',
          class: 'status-offline'
        };
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Show sync progress notification
   */
  showSyncProgress(message) {
    this.showNotification(message, 'info');
  }

  /**
   * Show sync success notification
   */
  showSyncSuccess(message = 'Sync completed successfully') {
    this.showNotification(message, 'success');
  }

  /**
   * Show sync error notification
   */
  showSyncError(message = 'Sync failed', error = null) {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    this.showNotification(errorMessage, 'error');
  }

  /**
   * Show a notification
   */
  showNotification(message, type = 'info') {
    console.log(`[SyncUI] ${type.toUpperCase()}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `sync-notification notification-${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * Create status bar HTML
   */
  createStatusBar() {
    return `
      <div class="sync-status-bar">
        <div id="sync-status" class="sync-status"></div>
        <div id="pending-count" class="pending-count"></div>
        <button id="sync-button" class="sync-button">Sync Now</button>
        <div id="last-sync" class="last-sync"></div>
      </div>
    `;
  }

  /**
   * Get CSS styles for the sync UI
   */
  getStyles() {
    return `
      .sync-status-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 15px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 500;
      }

      .status-online .status-indicator {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .status-syncing .status-indicator {
        background: #fff3e0;
        color: #f57c00;
      }

      .status-offline .status-indicator {
        background: #ffebee;
        color: #c62828;
      }

      .status-pending .status-indicator {
        background: #fff3e0;
        color: #f57c00;
      }

      .status-error .status-indicator {
        background: #ffebee;
        color: #c62828;
      }

      .pending-count {
        color: #666;
        font-size: 13px;
        display: none;
      }

      .sync-button {
        padding: 6px 16px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
      }

      .sync-button:hover:not(:disabled) {
        background: #45a049;
      }

      .sync-button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .last-sync {
        color: #666;
        font-size: 12px;
      }

      .sync-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
      }

      .notification-info {
        background: #2196F3;
        color: white;
      }

      .notification-success {
        background: #4CAF50;
        color: white;
      }

      .notification-error {
        background: #f44336;
        color: white;
      }

      .sync-notification.fade-out {
        animation: fadeOut 0.3s ease-out;
        opacity: 0;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    `;
  }

  /**
   * Register sync button click handler
   */
  onSyncButtonClick(callback) {
    this.onSyncClick = callback;
  }
}

// Export singleton instance
export const syncUI = new SyncUI();
export default syncUI;
