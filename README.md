# Express Passport Authentication Example

A complete Express.js authentication system with Passport.js, featuring both local authentication (email/password) and OAuth (Google), designed for migration to FusionAuth.

## Features

- **Local Authentication**: Email/password login with bcrypt password hashing
- **OAuth Authentication**: Google OAuth 2.0 integration
- **Session Management**: SQLite-based session storage
- **User Management**: Complete user CRUD operations
- **Modern UI**: Bootstrap 5 responsive interface
- **SQLite Database**: Lightweight database for development
- **FusionAuth Ready**: Structured for easy migration to FusionAuth

## Prerequisites

- Node.js 22.0.0 or higher
- npm 10.0.0 or higher

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ritza-co/fusionauth-migrating-node-express-passportjs-example.git webApp
cd webApp
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp config.env.example .env
```

Edit `.env` and configure:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Google OAuth Configuration
# Get these from https://console.developers.google.com/
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

4. Set up the database and seed test users:

```bash
npm run setup
```

5. (Optional) Start FusionAuth for migration testing:

```bash
npm run fusionauth:up
```

FusionAuth will be available at: <http://localhost:9011>

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Test Accounts

The setup script creates these test accounts (password: `password123`):

- `admin@example.com` - Admin User
- `user@example.com` - Regular User  
- `test@example.com` - Test User
- `unconfirmed@example.com` - Unconfirmed User (inactive)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add `http://localhost:3000/auth/google/callback` to the authorized redirect URIs
6. Copy the Client ID and Client Secret to your `.env` file

## Project Structure

```txt
├── app.js                 # Main application file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
├── models/
│   ├── database.js       # SQLite database connection
│   └── user.js          # User model and methods
├── routes/
│   ├── auth.js          # Authentication routes
│   └── dashboard.js     # Dashboard and user management routes
├── views/
│   ├── layout.ejs       # Main layout template
│   ├── index.ejs        # Home page
│   ├── error.ejs        # Error page
│   ├── auth/
│   │   ├── login.ejs    # Login page
│   │   ├── register.ejs # Registration page
│   │   └── profile.ejs  # User profile page
│   └── dashboard/
│       ├── index.ejs    # Dashboard overview
│       └── users.ejs    # User management
├── scripts/
│   └── setup.js         # Database setup and seeding
├── db/                  # SQLite database files (auto-created)
└── public/              # Static assets
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  google_id TEXT UNIQUE,
  avatar TEXT,
  provider TEXT DEFAULT 'local',
  verified BOOLEAN DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Sessions Table

```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  expires INTEGER NOT NULL,
  data TEXT
);
```

## API Endpoints

### Authentication

- `GET /login` - Login page
- `POST /login` - Local authentication
- `GET /register` - Registration page
- `POST /register` - User registration
- `GET /logout` - Logout
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback

### User Management

- `GET /profile` - User profile page
- `POST /profile` - Update profile
- `GET /dashboard` - Dashboard overview
- `GET /users` - User management
- `POST /users/:id/delete` - Delete user
- `POST /users/:id/toggle-active` - Toggle user status

## FusionAuth Integration

This project includes a pre-configured FusionAuth instance for testing migrations:

### Running FusionAuth

```bash
# Start FusionAuth with PostgreSQL and MailCatcher
npm run fusionauth:up

# View FusionAuth logs
npm run fusionauth:logs

# Stop FusionAuth
npm run fusionauth:down
```

### FusionAuth Configuration

The kickstart configuration includes:

- **Express Passport Application**: Pre-configured OAuth application for this project
- **API Key**: For programmatic access
- **Email Templates**: Magic link and 2FA templates
- **Custom Theme**: Styled interface
- **Test Users**: Admin and regular user accounts

### FusionAuth URLs

- **FusionAuth Admin**: <http://localhost:9011>
- **MailCatcher**: <http://localhost:1080> (for email testing)
- **Express App**: <http://localhost:3000>

### Application Details

- **Application ID**: `f47ac10b-58cc-4372-a567-0e02b2c3d479`
- **Client Secret**: `super-secret-secret-that-should-be-regenerated-for-production`
- **Redirect URL**: `http://localhost:3000/auth/fusionauth/callback`

## Migration Scripts

This project includes both generic FusionAuth migration scripts and legacy scripts for user migration.

### Generic Pattern Scripts (Recommended)

Following the FusionAuth generic import pattern with streaming JSON processing:

```bash
# 1. Export users from SQLite database
npm run export

# 2. Convert users to FusionAuth format
npm run convert

# 3. Import users (choose one method):
npm run import              # Individual imports (like generic pattern)
npm run import:bulk         # Bulk imports (faster for large datasets)
npm run import:social       # Social/OAuth users with identity linking
```

**Features:**
- ✅ **Streaming JSON processing** - Memory efficient for large datasets
- ✅ **UUID password generation** - For users without passwords (OAuth users)
- ✅ **Identity linking support** - Links Google OAuth accounts
- ✅ **Bcrypt hash parsing** - Preserves existing password hashes
- ✅ **Batch processing** - Configurable batch sizes for bulk imports

### Legacy Scripts (Alternative)

```bash
# Export users to FusionAuth format (all-in-one)
npm run export:legacy

# Import users to FusionAuth (bulk)
npm run import:legacy users_export_2024-01-15T10-30-00-000Z.json

# Import users individually (for debugging)
npm run import:individual users_export_2024-01-15T10-30-00-000Z.json
```

### Migration Workflow

1. **Setup FusionAuth**: `npm run fusionauth:up`
2. **Export users**: `npm run export` 
3. **Convert format**: `npm run convert`
4. **Import users**: `npm run import:bulk` (recommended for speed)
5. **Import social users**: `npm run import:social` (if you have OAuth users)

### Generated Files

- `users.json` - Raw user export from SQLite
- `faUsers.json` - FusionAuth-formatted users ready for import

