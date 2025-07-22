const User = require('../models/user');
const db = require('../models/database');

async function setup() {
  console.log('Setting up Express Passport application...');
  
  try {
    // Wait a bit for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Seeding test users...');
    await User.seedTestUsers();
    
    console.log('Setup completed successfully!');
    console.log('');
    console.log('Test accounts created:');
    console.log('- admin@example.com (password: password123)');
    console.log('- user@example.com (password: password123)');
    console.log('- test@example.com (password: password123)');
    console.log('- unconfirmed@example.com (password: password123)');
    console.log('');
    console.log('To start the application:');
    console.log('  npm start');
    console.log('');
    console.log('For development with auto-restart:');
    console.log('  npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup(); 