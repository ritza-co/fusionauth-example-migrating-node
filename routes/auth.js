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

module.exports = router; 