const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  res.redirect('/login');
}

// Middleware to check if user is not authenticated
function ensureNotAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/dashboard');
}

// Login page
router.get('/login', ensureNotAuthenticated, (req, res) => {
  res.render('auth/login', { 
    user: req.user,
    messages: req.flash()
  });
});

// Login POST
router.post('/login', ensureNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }
      await User.updateLastLogin(user.id);
      req.flash('success', 'Successfully logged in!');
      res.redirect('/dashboard');
    });
  })(req, res, next);
});

// Register page
router.get('/register', ensureNotAuthenticated, (req, res) => {
  res.render('auth/register', { 
    user: req.user,
    messages: req.flash()
  });
});

// Register POST
router.post('/register', ensureNotAuthenticated, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      req.flash('error', 'All fields are required');
      return res.redirect('/register');
    }
    
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long');
      return res.redirect('/register');
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }
    
    // Create new user
    const userId = await User.create({
      email,
      password,
      name,
      provider: 'local',
      verified: true, // For demo purposes, auto-verify
      active: true
    });
    
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/register');
  }
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Successfully logged out!');
    res.redirect('/');
  });
});

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      await User.updateLastLogin(req.user.id);
      req.flash('success', 'Successfully logged in with Google!');
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      req.flash('error', 'Login failed. Please try again.');
      res.redirect('/login');
    }
  }
);

// Profile page
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('auth/profile', { 
    user: req.user,
    messages: req.flash()
  });
});

// Update profile
router.post('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length < 2) {
      req.flash('error', 'Name must be at least 2 characters long');
      return res.redirect('/profile');
    }
    
    await User.update(req.user.id, { name: name.trim() });
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Profile update error:', error);
    req.flash('error', 'Profile update failed. Please try again.');
    res.redirect('/profile');
  }
});

// FusionAuth Connector API for Progressive Migration
router.post('/fusionauth/connector', async (req, res) => {
  const APPLICATION_ID = 'e9fdb985-9173-4e01-9d73-ac2d60d1dc8e';
  
  try {
    console.log(`FusionAuth connector request received for ${req.body.loginId}`);
    
    const { loginId, password } = req.body;
    
    // Validate required parameters
    if (!loginId || !password) {
      console.warn('Missing loginId or password in FusionAuth connector request');
      return res.status(400).json({ error: 'Missing loginId or password' });
    }
    
    // Find user by email
    const user = await User.findByEmail(loginId.toLowerCase());
    
    if (user && await authenticateConnectorUser(user, password)) {
      console.log(`User authentication successful for ${loginId}. Returning user data to FusionAuth`);
      
      const userData = await buildFusionAuthUser(user, password);
      console.log('Returning user data:', JSON.stringify(userData, null, 2));
      
      res.json({ user: userData });
    } else {
      console.warn(`Authentication failed for ${loginId}`);
      res.status(404).json({ error: 'User not found or authentication failed' });
    }
  } catch (error) {
    console.error('Error in FusionAuth connector:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions for FusionAuth connector
async function authenticateConnectorUser(user, password) {
  // Only authenticate local users with email/password
  if (user.provider === 'local' && user.password) {
    return bcrypt.compareSync(password, user.password);
  }
  
  return false;
}

async function buildFusionAuthUser(user, password) {
  const crypto = require('crypto');
  
  // Generate consistent UUID based on user ID
  const userUuid = generateConsistentUuid(user.id);
  
  return {
    // Required fields for FusionAuth
    id: userUuid,
    email: user.email,
    username: user.email,
    
    // Authentication fields - pass through the plaintext password for FusionAuth to hash
    password: password, // Pass through the plaintext password for FusionAuth to hash
    passwordChangeRequired: false,
    
    // User profile fields
    fullName: user.name,
    firstName: extractFirstName(user.name),
    lastName: extractLastName(user.name),
    imageUrl: user.avatar,
    verified: user.verified,
    active: user.active,
    
    // Timestamps
    insertInstant: user.createdAt ? new Date(user.createdAt).getTime() : Date.now(),
    lastUpdateInstant: user.updatedAt ? new Date(user.updatedAt).getTime() : Date.now(),
    lastLoginInstant: user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : null,
    
    // Application registration - associate user with the application
    registrations: [{
      id: crypto.randomUUID(),
      applicationId: APPLICATION_ID,
      verified: user.verified,
      roles: ['user']
    }],
    
    // Migration metadata stored in user data
    data: {
      migrated_from: 'local_authentication',
      original_id: user.id,
      migrated_at: new Date().toISOString(),
      provider: user.provider,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      migration_note: 'User migrated from email/password authentication'
    }
  };
}



function generateConsistentUuid(userId) {
  // Generate a consistent UUID based on user ID
  const crypto = require('crypto');
  const namespaceUuid = '550e8400-e29b-41d4-a716-446655440002'; // Different namespace for connector
  const data = `connector_user_${userId}`;
  
  // Create a deterministic UUID using SHA-1 hash (UUID v5)
  const hash = crypto.createHash('sha1').update(namespaceUuid + data).digest();
  
  // Format as UUID v5
  const hashHex = hash.toString('hex');
  const uuid = `${hashHex.substring(0, 8)}-${hashHex.substring(8, 12)}-5${hashHex.substring(13, 16)}-${(parseInt(hashHex.substring(16, 17), 16) & 0x3 | 0x8).toString(16)}${hashHex.substring(17, 20)}-${hashHex.substring(20, 32)}`;
  
  return uuid;
}

function extractFirstName(fullName) {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

function extractLastName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  return parts.length < 2 ? '' : parts.slice(1).join(' ');
}

module.exports = router; 