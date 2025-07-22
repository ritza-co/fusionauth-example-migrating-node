const express = require('express');
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

// Dashboard page
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Get all users for admin view (in a real app, you'd check permissions)
    const allUsers = await User.findAll();
    
    res.render('dashboard/index', { 
      user: req.user,
      users: allUsers,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
});

// User management (admin only in real app)
router.get('/users', ensureAuthenticated, async (req, res) => {
  try {
    const users = await User.findAll();
    res.render('dashboard/users', { 
      user: req.user,
      users: users,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Users list error:', error);
    req.flash('error', 'Failed to load users');
    res.redirect('/dashboard');
  }
});

// Delete user (admin only in real app)
router.post('/users/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Prevent self-deletion
    if (userId === req.user.id) {
      req.flash('error', 'You cannot delete your own account');
      return res.redirect('/users');
    }
    
    const deleted = await User.delete(userId);
    if (deleted) {
      req.flash('success', 'User deleted successfully');
    } else {
      req.flash('error', 'User not found');
    }
    
    res.redirect('/users');
  } catch (error) {
    console.error('Delete user error:', error);
    req.flash('error', 'Failed to delete user');
    res.redirect('/users');
  }
});

// Toggle user active status
router.post('/users/:id/toggle-active', ensureAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.findById(userId);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/users');
    }
    
    // Prevent self-deactivation
    if (userId === req.user.id) {
      req.flash('error', 'You cannot deactivate your own account');
      return res.redirect('/users');
    }
    
    await User.update(userId, { active: !user.active });
    req.flash('success', `User ${user.active ? 'deactivated' : 'activated'} successfully`);
    
    res.redirect('/users');
  } catch (error) {
    console.error('Toggle user status error:', error);
    req.flash('error', 'Failed to update user status');
    res.redirect('/users');
  }
});

module.exports = router; 