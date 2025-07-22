const User = require('../models/user');
const bcrypt = require('bcrypt');

// Mock database for testing
jest.mock('../models/database', () => {
  const mockDb = {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
  };
  return mockDb;
});

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        provider: 'local',
        verified: true,
        active: true
      };

      const mockDb = require('../models/database');
      mockDb.run.mockImplementation((sql, params, callback) => {
        callback(null, { lastID: 1 });
      });

      const result = await User.create(userData);
      
      expect(result).toBe(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          'test@example.com',
          expect.stringMatching(/^\$2[aby]\$\d+\$/), // bcrypt hash pattern
          'Test User',
          null, // googleId
          null, // avatar
          'local',
          1, // verified
          1  // active
        ]),
        expect.any(Function)
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        name: 'Test User',
        google_id: null,
        avatar: null,
        provider: 'local',
        verified: 1,
        active: 1,
        last_login_at: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const mockDb = require('../models/database');
      mockDb.get.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      const result = await User.findByEmail('test@example.com');
      
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        name: 'Test User',
        googleId: null,
        avatar: null,
        provider: 'local',
        verified: true,
        active: true,
        lastLoginAt: null,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      });
    });
  });

  describe('formatUser', () => {
    it('should format database row to user object', () => {
      const dbRow = {
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        name: 'Test User',
        google_id: 'google123',
        avatar: 'https://example.com/avatar.jpg',
        provider: 'google',
        verified: 1,
        active: 0,
        last_login_at: '2023-01-01T00:00:00.000Z',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const result = User.formatUser(dbRow);
      
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        name: 'Test User',
        googleId: 'google123',
        avatar: 'https://example.com/avatar.jpg',
        provider: 'google',
        verified: true,
        active: false,
        lastLoginAt: '2023-01-01T00:00:00.000Z',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      });
    });
  });
}); 