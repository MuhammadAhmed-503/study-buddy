# 🔗 Database Connection Options

You can easily switch between different database providers. Here are your options:

## 🟢 Current: Supabase (Recommended & Working)

**Status**: ✅ Fully implemented and working
**Features**: Auth, Database, File Storage, Real-time
**Setup**: Already configured and ready to use

```bash
# Your current Supabase setup is working perfectly!
# Database URL: https://bhmqgdikfehhmazjdhar.supabase.co
```

## 🔵 Option 1: Firebase

**Features**: Auth, Firestore, File Storage, Real-time
**Cost**: Free tier available

### Setup Steps:
1. **Create Firebase Project**
   ```bash
   npm install firebase
   ```

2. **Update Environment**
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Switch Database Adapter**
   ```typescript
   // In your services, replace:
   import { supabase } from '@/integrations/supabase/client';
   
   // With:
   import { DatabaseFactory } from '@/lib/database-adapters';
   const db = DatabaseFactory.createAdapter({ 
     type: 'firebase', 
     projectId: 'your_project_id' 
   });
   ```

## 🟡 Option 2: MongoDB + Express Backend

**Features**: Full control, scalable, custom auth
**Cost**: Various hosting options

### Setup Steps:
1. **Create Backend API**
   ```bash
   mkdir api && cd api
   npm init -y
   npm install express mongoose bcryptjs jsonwebtoken multer
   ```

2. **Database Schema**
   ```javascript
   // models/User.js
   const userSchema = new mongoose.Schema({
     email: String,
     password: String,
     createdAt: { type: Date, default: Date.now }
   });

   // models/Note.js
   const noteSchema = new mongoose.Schema({
     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
     title: String,
     content: String,
     fileName: String,
     createdAt: { type: Date, default: Date.now }
   });
   ```

3. **API Endpoints**
   ```javascript
   // routes/auth.js
   app.post('/api/auth/login', async (req, res) => {
     // Login logic
   });

   // routes/notes.js
   app.get('/api/notes', async (req, res) => {
     // Get user notes
   });
   ```

4. **Update Frontend Services**
   ```typescript
   // services/NotesService.ts
   static async getUserNotes() {
     const response = await fetch('/api/notes', {
       headers: { Authorization: `Bearer ${token}` }
     });
     return response.json();
   }
   ```

## 🟣 Option 3: PostgreSQL + Node.js

**Features**: Robust relational database, custom backend
**Cost**: Various hosting options (Railway, Render, etc.)

### Setup Steps:
1. **Backend with PostgreSQL**
   ```bash
   npm install express pg bcryptjs jsonwebtoken
   npm install --save-dev @types/pg
   ```

2. **Database Connection**
   ```typescript
   import { Pool } from 'pg';
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });
   ```

3. **SQL Schema**
   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE notes (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id),
     title VARCHAR(255) NOT NULL,
     content TEXT,
     file_name VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

## 🔴 Option 4: Local SQLite (Development)

**Features**: No internet required, fast development
**Cost**: Free

### Setup Steps:
1. **Install Dependencies**
   ```bash
   npm install better-sqlite3
   npm install --save-dev @types/better-sqlite3
   ```

2. **Database Setup**
   ```typescript
   import Database from 'better-sqlite3';
   
   const db = new Database('study-buddy.db');
   
   // Create tables
   db.exec(`
     CREATE TABLE IF NOT EXISTS notes (
       id TEXT PRIMARY KEY,
       title TEXT,
       content TEXT,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )
   `);
   ```

## 🚀 Quick Switch Guide

To switch from Supabase to another database:

### 1. Keep Current Setup (Recommended)
Your Supabase setup is working perfectly! No need to change.

### 2. If You Want to Switch:

1. **Choose your preferred option above**
2. **Update environment variables**
3. **Modify services to use new database adapter**
4. **Test authentication and data operations**
5. **Deploy with new configuration**

## 📊 Database Comparison

| Feature | Supabase | Firebase | MongoDB | PostgreSQL | SQLite |
|---------|----------|----------|---------|------------|--------|
| Setup Time | ✅ Easy | ✅ Easy | 🟡 Medium | 🟡 Medium | ✅ Easy |
| Real-time | ✅ Yes | ✅ Yes | 🟡 Custom | 🟡 Custom | ❌ No |
| File Storage | ✅ Built-in | ✅ Built-in | 🟡 External | 🟡 External | ❌ No |
| Scaling | ✅ Auto | ✅ Auto | 🟡 Manual | 🟡 Manual | ❌ Limited |
| Cost | 💰 Freemium | 💰 Freemium | 💰💰 Varies | 💰💰 Hosting | 🆓 Free |

## 💡 Recommendation

**Stick with Supabase** - Your current setup is:
- ✅ Working perfectly
- ✅ Feature-complete
- ✅ Scalable
- ✅ Has auth, database, and file storage
- ✅ Real-time capabilities
- ✅ Good free tier

The quiz functionality is now fully implemented and working with your current Supabase setup!