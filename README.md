# Express Passport Authentication Example

A complete Express.js authentication system with Passport.js, featuring both local authentication (email/password) and OAuth (Google), designed for migration to FusionAuth.

## Prerequisites

- Node.js 22.0.0 or higher
- npm 10.0.0 or higher

## Installation

1. Clone the repository:

```bash
git clone https://github.com/fusionauth/fusionauth-example-migrating-node.git webApp
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


## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add `http://localhost:3000/auth/google/callback` to the authorized redirect URIs
6. Copy the Client ID and Client Secret to your `.env` file

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

- **Client Secret**: `super-secret-secret-that-should-be-regenerated-for-production`
- **Redirect URL**: `http://localhost:3000/auth/fusionauth/callback`
