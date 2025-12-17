# API Integration Guide

Complete guide for integrating the Eco-System mobile app with your backend API for data synchronization.

## Table of Contents
- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Request/Response Formats](#requestresponse-formats)
- [Implementation Guide](#implementation-guide)
- [Error Handling](#error-handling)
- [Testing](#testing)

## Overview

The mobile app uses a sync-based architecture where:
1. Data is cached locally in SQLite for offline access
2. Changes are queued when offline
3. Sync occurs automatically when online or manually via "Sync Now"
4. Server API provides CRUD operations for all entity types

### Sync Flow

```
Mobile App                          Backend API
    |                                    |
    |-- 1. GET /api/mobile/auth -------->| Authenticate
    |<------ Return JWT token -----------|
    |                                    |
    |-- 2. POST /api/mobile/sync/audits->| Upload pending audits
    |<------ Return server IDs ----------|
    |                                    |
    |-- 3. GET /api/mobile/user/schedule>| Fetch latest schedule
    |<------ Return schedule data -------|
    |                                    |
    |-- 4. GET /api/mobile/user/job-cards| Fetch job cards
    |<------ Return job cards -----------|
    |                                    |
    |-- 5. GET /api/mobile/user/earnings>| Fetch earnings
    |<------ Return earnings data -------|
```

## API Endpoints

### Authentication

#### POST `/api/mobile/auth/login`

Login and receive authentication token.

**Request:**
```json
{
  "username": "john.doe",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "username": "john.doe",
    "name": "John Doe",
    "role": "field_worker"
  },
  "expiresIn": 86400
}
```

**Status Codes:**
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded

---

#### POST `/api/mobile/auth/refresh`

Refresh expired token.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

---

### Audit Sync

#### POST `/api/mobile/sync/audits`

Upload pending audits to server.

**Request:**
```json
{
  "audits": [
    {
      "localId": 1,
      "title": "Daily Safety Check",
      "notes": "All safety equipment verified",
      "photos": [
        "https://example.com/uploads/photo1.jpg",
        "https://example.com/uploads/photo2.jpg"
      ],
      "createdAt": 1704067200000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced": [
    {
      "localId": 1,
      "serverId": 456,
      "status": "synced",
      "syncedAt": 1704070800000
    }
  ],
  "failed": []
}
```

**Status Codes:**
- `200 OK` - Audits processed (check individual results)
- `400 Bad Request` - Invalid data format
- `401 Unauthorized` - Invalid/expired token
- `413 Payload Too Large` - Request too large

---

#### GET `/api/mobile/user/audits`

Retrieve user's audits from server (for initial sync or refresh).

**Query Parameters:**
- `since` (optional): Unix timestamp, only return audits modified after this time
- `limit` (optional): Max number of results (default: 100)

**Example:** `/api/mobile/user/audits?since=1704067200000&limit=50`

**Response:**
```json
{
  "success": true,
  "audits": [
    {
      "id": 456,
      "title": "Daily Safety Check",
      "notes": "All safety equipment verified",
      "photos": [
        "https://example.com/uploads/photo1.jpg",
        "https://example.com/uploads/photo2.jpg"
      ],
      "status": "synced",
      "createdAt": 1704067200000,
      "updatedAt": 1704070800000
    }
  ],
  "hasMore": false
}
```

---

### Schedule

#### GET `/api/mobile/user/schedule`

Fetch user's work schedule.

**Query Parameters:**
- `startDate` (optional): Date in YYYY-MM-DD format
- `endDate` (optional): Date in YYYY-MM-DD format

**Example:** `/api/mobile/user/schedule?startDate=2024-01-01&endDate=2024-01-31`

**Response:**
```json
{
  "success": true,
  "schedules": [
    {
      "id": 1,
      "date": "2024-01-15",
      "jobTitle": "Residential Renovation",
      "location": "123 Main St, Springfield",
      "startTime": "08:00",
      "endTime": "16:00",
      "status": "scheduled",
      "crewSize": 4,
      "equipment": ["Excavator", "Concrete mixer"],
      "notes": "Weather dependent"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Schedule retrieved
- `401 Unauthorized` - Invalid token

---

### Job Cards

#### GET `/api/mobile/user/job-cards`

Fetch user's job cards.

**Query Parameters:**
- `status` (optional): Filter by status (active, pending, completed)
- `limit` (optional): Max results (default: 100)

**Example:** `/api/mobile/user/job-cards?status=active`

**Response:**
```json
{
  "success": true,
  "jobCards": [
    {
      "id": 1,
      "jobNumber": "JOB-2024-001",
      "client": "ABC Construction Co.",
      "title": "Foundation Repair",
      "status": "active",
      "priority": "high",
      "assignedTo": "John Smith",
      "progress": 65,
      "tasks": [
        {
          "id": 1,
          "name": "Site assessment",
          "completed": true
        },
        {
          "id": 2,
          "name": "Material delivery",
          "completed": true
        }
      ],
      "notes": "Weather dependent - check forecast",
      "startDate": "2024-01-10",
      "estimatedCompletion": "2024-01-25",
      "updatedAt": 1704067200000
    }
  ]
}
```

---

#### POST `/api/mobile/sync/job-cards`

Upload job card updates.

**Request:**
```json
{
  "updates": [
    {
      "jobNumber": "JOB-2024-001",
      "progress": 75,
      "tasks": [
        {
          "id": 1,
          "completed": true
        },
        {
          "id": 2,
          "completed": true
        },
        {
          "id": 3,
          "completed": true
        }
      ],
      "notes": "Foundation work completed",
      "updatedAt": 1704153600000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": [
    {
      "jobNumber": "JOB-2024-001",
      "status": "updated",
      "syncedAt": 1704157200000
    }
  ],
  "failed": []
}
```

---

### Earnings

#### GET `/api/mobile/user/earnings`

Fetch user's earnings data.

**Query Parameters:**
- `period` (optional): Period in YYYY-MM format
- `limit` (optional): Max results (default: 12)

**Example:** `/api/mobile/user/earnings?period=2024-01`

**Response:**
```json
{
  "success": true,
  "earnings": [
    {
      "id": 1,
      "amount": 4250.00,
      "period": "2024-01",
      "description": "January 2024 - Regular hours",
      "hours": 160,
      "overtimeHours": 12,
      "rate": 25.00,
      "overtimeRate": 37.50,
      "breakdown": {
        "regular": 4000.00,
        "overtime": 450.00,
        "bonus": 0.00,
        "deductions": -200.00
      },
      "paidDate": "2024-02-05"
    }
  ]
}
```

---

### Photo Upload

#### POST `/api/mobile/uploads`

Upload photo files for audits.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `photo` (file)
- Field: `timestamp` (number)
- Field: `auditId` (optional, number)

**Alternative (base64):**
```json
{
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "timestamp": 1704067200000,
  "auditId": 1
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com/uploads/photo-1704067200000.jpg",
  "size": 204800,
  "uploadedAt": 1704067200000
}
```

**Status Codes:**
- `200 OK` - Upload successful
- `400 Bad Request` - Invalid file format
- `413 Payload Too Large` - File too large (> 10MB)
- `401 Unauthorized` - Invalid token

---

## Authentication

### JWT Token Format

The API uses JWT (JSON Web Tokens) for authentication.

**Token Structure:**
```
Header.Payload.Signature
```

**Payload Example:**
```json
{
  "userId": 123,
  "username": "john.doe",
  "role": "field_worker",
  "iat": 1704067200,
  "exp": 1704153600
}
```

### Using Tokens in Requests

Include token in Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh Strategy

1. Store token in Capacitor Preferences (encrypted)
2. Include in all API requests
3. If response is `401 Unauthorized`:
   - Try refresh token endpoint
   - If refresh succeeds, retry original request
   - If refresh fails, redirect to login

### Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** using Capacitor Preferences
3. **Validate tokens server-side** on every request
4. **Implement rate limiting** to prevent abuse
5. **Set reasonable token expiration** (e.g., 24 hours)
6. **Log out on multiple failed refreshes**

## Request/Response Formats

### Standard Request Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
Accept: application/json
X-App-Version: 1.0.0
X-Platform: ios|android
```

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { /* ... */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data format",
    "details": {
      "field": "title",
      "issue": "Title is required"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

## Implementation Guide

### Update API Base URL

Edit `src/app-mobile.js`:

```javascript
async apiRequest(endpoint, method = 'GET', data = null) {
  // Change this to your API URL
  const API_BASE = 'https://api.yourcompany.com';
  
  try {
    const response = await fetch(API_BASE + endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        'Accept': 'application/json',
        'X-App-Version': '1.0.0',
        'X-Platform': Capacitor.getPlatform()
      },
      body: data ? JSON.stringify(data) : null
    });

    // Handle non-OK responses
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired - try refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          return this.apiRequest(endpoint, method, data);
        } else {
          // Redirect to login
          throw new Error('Authentication required');
        }
      }
      
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Request failed:', error);
    throw error;
  }
}
```

### Implement Token Refresh

```javascript
async refreshToken() {
  try {
    const { value: refreshToken } = await Preferences.get({ key: 'refreshToken' });
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(API_BASE + '/api/mobile/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      await this.saveAuthToken(data.token);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    return false;
  }
}
```

### Implement Sync Functions

Example for syncing audits:

```javascript
async syncAudit(audit) {
  try {
    // Upload photos first
    const photoUrls = [];
    for (const photo of audit.photos) {
      const formData = new FormData();
      formData.append('photo', photo.dataUrl);
      formData.append('timestamp', photo.timestamp);

      const response = await fetch(API_BASE + '/api/mobile/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        body: formData
      });

      const result = await response.json();
      photoUrls.push(result.url);
    }

    // Send audit with photo URLs
    const response = await this.apiRequest('/api/mobile/sync/audits', 'POST', {
      audits: [{
        localId: audit.id,
        title: audit.title,
        notes: audit.notes,
        photos: photoUrls,
        createdAt: audit.created_at
      }]
    });

    // Update local database
    const synced = response.synced[0];
    await offlineSync.updateAuditSyncStatus(
      audit.id, 
      'synced', 
      synced.serverId
    );

    return true;
  } catch (error) {
    await offlineSync.updateAuditSyncStatus(
      audit.id, 
      'error', 
      null, 
      error.message
    );
    throw error;
  }
}
```

## Error Handling

### Network Errors

```javascript
try {
  await this.performSync();
} catch (error) {
  if (error.message === 'Failed to fetch') {
    // Network error - likely offline
    syncUI.showSyncError('No internet connection');
  } else if (error.message === 'Authentication required') {
    // Token expired and refresh failed
    // Redirect to login
  } else {
    // Other error
    syncUI.showSyncError('Sync failed', error);
  }
}
```

### Retry Logic with Exponential Backoff

```javascript
async performSyncWithRetry(maxRetries = 3) {
  const delays = [1000, 2000, 4000, 8000]; // Exponential backoff
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await this.performSync();
      return true; // Success
    } catch (error) {
      if (i < maxRetries - 1) {
        const delay = delays[i];
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Final attempt failed
      }
    }
  }
}
```

### Partial Sync Handling

```javascript
async performSync() {
  const results = {
    audits: { success: 0, failed: 0 },
    jobCards: { success: 0, failed: 0 }
  };

  // Sync audits (don't fail entire sync if one audit fails)
  const audits = await offlineSync.getPendingAudits();
  for (const audit of audits) {
    try {
      await this.syncAudit(audit);
      results.audits.success++;
    } catch (error) {
      results.audits.failed++;
      console.error('Audit sync failed:', error);
    }
  }

  // Continue with other syncs...
  
  return results;
}
```

## Testing

### Test Endpoints with cURL

**Login:**
```bash
curl -X POST https://api.yourcompany.com/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"password123"}'
```

**Get Schedule:**
```bash
curl -X GET "https://api.yourcompany.com/api/mobile/user/schedule?startDate=2024-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Upload Audit:**
```bash
curl -X POST https://api.yourcompany.com/api/mobile/sync/audits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "audits": [{
      "localId": 1,
      "title": "Test Audit",
      "notes": "Testing",
      "photos": [],
      "createdAt": 1704067200000
    }]
  }'
```

### Mock API for Development

Create `src/mock-api.js` for testing without backend:

```javascript
export class MockAPI {
  async login(username, password) {
    await this.delay(500);
    return {
      success: true,
      token: 'mock_token_' + Date.now(),
      user: { id: 1, username, name: 'Test User' }
    };
  }

  async getSchedule() {
    await this.delay(1000);
    return {
      success: true,
      schedules: [/* mock data */]
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Integration Testing

```javascript
// Test sync flow
async function testSyncFlow() {
  // 1. Login
  const authResponse = await fetch('/api/mobile/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'test', password: 'test' })
  });
  const { token } = await authResponse.json();

  // 2. Create offline audit
  await offlineSync.createAudit({
    title: 'Test Audit',
    notes: 'Testing sync',
    photos: []
  });

  // 3. Sync
  const syncResponse = await fetch('/api/mobile/sync/audits', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      audits: [/* pending audits */]
    })
  });

  // 4. Verify
  const result = await syncResponse.json();
  console.assert(result.success, 'Sync should succeed');
  console.assert(result.synced.length > 0, 'Should have synced audits');
}
```

## Backend Implementation Example (Node.js/Express)

```javascript
// Example backend endpoint
app.post('/api/mobile/sync/audits', authenticateToken, async (req, res) => {
  try {
    const { audits } = req.body;
    const userId = req.user.id;
    
    const synced = [];
    const failed = [];

    for (const audit of audits) {
      try {
        // Save to database
        const result = await db.audits.create({
          userId,
          title: audit.title,
          notes: audit.notes,
          photos: JSON.stringify(audit.photos),
          createdAt: new Date(audit.createdAt)
        });

        synced.push({
          localId: audit.localId,
          serverId: result.id,
          status: 'synced',
          syncedAt: Date.now()
        });
      } catch (error) {
        failed.push({
          localId: audit.localId,
          error: error.message
        });
      }
    }

    res.json({ success: true, synced, failed });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});
```

## Next Steps

1. Implement authentication endpoints on your backend
2. Create database tables for audits, schedules, job cards, earnings
3. Implement sync endpoints
4. Test with mobile app
5. Add rate limiting and security measures
6. Monitor API performance and errors
7. Implement proper logging

## Additional Resources

- [REST API Design Best Practices](https://restfulapi.net/)
- [JWT Authentication](https://jwt.io/)
- [Capacitor HTTP Plugin](https://capacitorjs.com/docs/apis/http)
- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
