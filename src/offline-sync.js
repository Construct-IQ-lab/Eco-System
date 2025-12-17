/**
 * Offline Sync Manager
 * Handles SQLite database initialization, CRUD operations, and sync queue management
 * for the Eco-System mobile app
 */

import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

class OfflineSyncManager {
  constructor() {
    this.dbName = 'ecosystemdb';
    this.db = null;
    this.isInitialized = false;
    this.syncCallbacks = [];
  }

  /**
   * Initialize the SQLite database and create tables
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      console.log('[OfflineSync] Initializing database on platform:', platform);

      // Check if SQLite plugin is available
      if (!CapacitorSQLite) {
        throw new Error('SQLite plugin not available');
      }

      // Create connection
      this.db = await CapacitorSQLite.createConnection({
        database: this.dbName,
        version: 1,
        encrypted: false,
        mode: 'no-encryption',
        readonly: false
      });

      // Open database
      await this.db.open();

      // Create tables
      await this.createTables();

      this.isInitialized = true;
      console.log('[OfflineSync] Database initialized successfully');
    } catch (error) {
      console.error('[OfflineSync] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create all required database tables
   */
  async createTables() {
    const tables = [
      // Audits table - stores audit data with sync status
      `CREATE TABLE IF NOT EXISTS audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        notes TEXT,
        photos TEXT,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        synced_at INTEGER,
        server_id INTEGER,
        last_error TEXT
      )`,

      // Schedules table - caches user schedule data
      `CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        job_title TEXT NOT NULL,
        location TEXT,
        data TEXT,
        last_synced_at INTEGER
      )`,

      // Job cards table - stores job card information
      `CREATE TABLE IF NOT EXISTS job_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_number TEXT NOT NULL,
        client TEXT,
        data TEXT,
        status TEXT DEFAULT 'active',
        updated_at INTEGER,
        synced_at INTEGER
      )`,

      // Earnings table - caches earnings data
      `CREATE TABLE IF NOT EXISTS earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        period TEXT NOT NULL,
        description TEXT,
        last_synced_at INTEGER
      )`
    ];

    for (const tableSQL of tables) {
      try {
        await this.db.execute(tableSQL);
      } catch (error) {
        console.error('[OfflineSync] Error creating table:', error);
        throw error;
      }
    }

    console.log('[OfflineSync] All tables created successfully');
  }

  /**
   * AUDIT OPERATIONS
   */

  /**
   * Create a new audit (offline-capable)
   */
  async createAudit(auditData) {
    try {
      const { title, notes, photos } = auditData;
      const createdAt = Date.now();

      const query = `INSERT INTO audits (title, notes, photos, status, created_at) 
                     VALUES (?, ?, ?, 'pending', ?)`;
      const values = [title, notes || '', JSON.stringify(photos || []), createdAt];

      const result = await this.db.run(query, values);
      
      console.log('[OfflineSync] Audit created locally:', result.changes.lastId);
      
      // Trigger sync callback
      this.notifySyncNeeded('audit_created');
      
      return {
        id: result.changes.lastId,
        status: 'pending',
        createdAt
      };
    } catch (error) {
      console.error('[OfflineSync] Error creating audit:', error);
      throw error;
    }
  }

  /**
   * Get all audits
   */
  async getAudits(filter = {}) {
    try {
      let query = 'SELECT * FROM audits';
      const conditions = [];
      const values = [];

      if (filter.status) {
        conditions.push('status = ?');
        values.push(filter.status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.db.query(query, values);
      
      return result.values.map(audit => ({
        ...audit,
        photos: JSON.parse(audit.photos || '[]')
      }));
    } catch (error) {
      console.error('[OfflineSync] Error getting audits:', error);
      throw error;
    }
  }

  /**
   * Get pending audits that need to be synced
   */
  async getPendingAudits() {
    return this.getAudits({ status: 'pending' });
  }

  /**
   * Update audit sync status
   */
  async updateAuditSyncStatus(localId, status, serverId = null, error = null) {
    try {
      const syncedAt = status === 'synced' ? Date.now() : null;
      const query = `UPDATE audits 
                     SET status = ?, synced_at = ?, server_id = ?, last_error = ? 
                     WHERE id = ?`;
      const values = [status, syncedAt, serverId, error, localId];

      await this.db.run(query, values);
      console.log(`[OfflineSync] Audit ${localId} status updated to ${status}`);
    } catch (error) {
      console.error('[OfflineSync] Error updating audit status:', error);
      throw error;
    }
  }

  /**
   * SCHEDULE OPERATIONS
   */

  /**
   * Cache schedules from server
   */
  async cacheSchedules(schedules) {
    try {
      // Clear old schedules (older than 90 days)
      const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
      await this.db.run('DELETE FROM schedules WHERE last_synced_at < ?', [ninetyDaysAgo]);

      // Insert or update new schedules
      for (const schedule of schedules) {
        const query = `INSERT OR REPLACE INTO schedules 
                       (date, job_title, location, data, last_synced_at) 
                       VALUES (?, ?, ?, ?, ?)`;
        const values = [
          schedule.date,
          schedule.job_title,
          schedule.location || '',
          JSON.stringify(schedule),
          Date.now()
        ];
        await this.db.run(query, values);
      }

      console.log(`[OfflineSync] Cached ${schedules.length} schedules`);
    } catch (error) {
      console.error('[OfflineSync] Error caching schedules:', error);
      throw error;
    }
  }

  /**
   * Get cached schedules
   */
  async getSchedules(startDate = null, endDate = null) {
    try {
      let query = 'SELECT * FROM schedules';
      const conditions = [];
      const values = [];

      if (startDate) {
        conditions.push('date >= ?');
        values.push(startDate);
      }

      if (endDate) {
        conditions.push('date <= ?');
        values.push(endDate);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY date ASC';

      const result = await this.db.query(query, values);
      
      return result.values.map(schedule => JSON.parse(schedule.data));
    } catch (error) {
      console.error('[OfflineSync] Error getting schedules:', error);
      throw error;
    }
  }

  /**
   * JOB CARD OPERATIONS
   */

  /**
   * Cache job cards from server
   */
  async cacheJobCards(jobCards) {
    try {
      for (const jobCard of jobCards) {
        const query = `INSERT OR REPLACE INTO job_cards 
                       (job_number, client, data, status, updated_at, synced_at) 
                       VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [
          jobCard.job_number,
          jobCard.client || '',
          JSON.stringify(jobCard),
          jobCard.status || 'active',
          Date.now(),
          Date.now()
        ];
        await this.db.run(query, values);
      }

      console.log(`[OfflineSync] Cached ${jobCards.length} job cards`);
    } catch (error) {
      console.error('[OfflineSync] Error caching job cards:', error);
      throw error;
    }
  }

  /**
   * Get cached job cards
   */
  async getJobCards(filter = {}) {
    try {
      let query = 'SELECT * FROM job_cards';
      const conditions = [];
      const values = [];

      if (filter.status) {
        conditions.push('status = ?');
        values.push(filter.status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY updated_at DESC';

      const result = await this.db.query(query, values);
      
      return result.values.map(jobCard => JSON.parse(jobCard.data));
    } catch (error) {
      console.error('[OfflineSync] Error getting job cards:', error);
      throw error;
    }
  }

  /**
   * Update job card locally (offline-capable)
   */
  async updateJobCard(jobNumber, updates) {
    try {
      // Get existing job card
      const result = await this.db.query(
        'SELECT data FROM job_cards WHERE job_number = ?',
        [jobNumber]
      );

      if (result.values.length === 0) {
        throw new Error(`Job card ${jobNumber} not found`);
      }

      const jobCard = JSON.parse(result.values[0].data);
      const updatedJobCard = { ...jobCard, ...updates };

      const query = `UPDATE job_cards 
                     SET data = ?, updated_at = ?, synced_at = NULL, status = 'pending'
                     WHERE job_number = ?`;
      const values = [JSON.stringify(updatedJobCard), Date.now(), jobNumber];

      await this.db.run(query, values);
      
      console.log(`[OfflineSync] Job card ${jobNumber} updated locally`);
      this.notifySyncNeeded('job_card_updated');
      
      return updatedJobCard;
    } catch (error) {
      console.error('[OfflineSync] Error updating job card:', error);
      throw error;
    }
  }

  /**
   * EARNINGS OPERATIONS
   */

  /**
   * Cache earnings from server
   */
  async cacheEarnings(earnings) {
    try {
      // Clear old earnings
      await this.db.run('DELETE FROM earnings');

      // Insert new earnings
      for (const earning of earnings) {
        const query = `INSERT INTO earnings (amount, period, description, last_synced_at) 
                       VALUES (?, ?, ?, ?)`;
        const values = [
          earning.amount,
          earning.period,
          earning.description || '',
          Date.now()
        ];
        await this.db.run(query, values);
      }

      console.log(`[OfflineSync] Cached ${earnings.length} earnings`);
    } catch (error) {
      console.error('[OfflineSync] Error caching earnings:', error);
      throw error;
    }
  }

  /**
   * Get cached earnings
   */
  async getEarnings() {
    try {
      const result = await this.db.query('SELECT * FROM earnings ORDER BY period DESC');
      return result.values;
    } catch (error) {
      console.error('[OfflineSync] Error getting earnings:', error);
      throw error;
    }
  }

  /**
   * SYNC QUEUE MANAGEMENT
   */

  /**
   * Get count of pending items that need sync
   */
  async getPendingSyncCount() {
    try {
      const audits = await this.db.query(
        "SELECT COUNT(*) as count FROM audits WHERE status = 'pending'"
      );
      const jobCards = await this.db.query(
        "SELECT COUNT(*) as count FROM job_cards WHERE synced_at IS NULL AND status = 'pending'"
      );

      return {
        audits: audits.values[0].count,
        jobCards: jobCards.values[0].count,
        total: audits.values[0].count + jobCards.values[0].count
      };
    } catch (error) {
      console.error('[OfflineSync] Error getting pending count:', error);
      return { audits: 0, jobCards: 0, total: 0 };
    }
  }

  /**
   * Register callback for sync notifications
   */
  onSyncNeeded(callback) {
    this.syncCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks that sync is needed
   */
  notifySyncNeeded(reason) {
    console.log('[OfflineSync] Sync needed:', reason);
    this.syncCallbacks.forEach(callback => {
      try {
        callback(reason);
      } catch (error) {
        console.error('[OfflineSync] Error in sync callback:', error);
      }
    });
  }

  /**
   * Clear all data (for testing or logout)
   */
  async clearAllData() {
    try {
      await this.db.execute('DELETE FROM audits');
      await this.db.execute('DELETE FROM schedules');
      await this.db.execute('DELETE FROM job_cards');
      await this.db.execute('DELETE FROM earnings');
      console.log('[OfflineSync] All data cleared');
    } catch (error) {
      console.error('[OfflineSync] Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      if (this.db) {
        await this.db.close();
        this.isInitialized = false;
        console.log('[OfflineSync] Database closed');
      }
    } catch (error) {
      console.error('[OfflineSync] Error closing database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncManager();
export default offlineSync;
