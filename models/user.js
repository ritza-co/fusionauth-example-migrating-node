const db = require('./database');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    return new Promise((resolve, reject) => {
      const { email, password, name, googleId, avatar, provider, verified, active } = userData;
      
      let hashedPassword = null;
      if (password) {
        hashedPassword = bcrypt.hashSync(password, 10);
      }
      
      const sql = `
        INSERT INTO users (email, password, name, google_id, avatar, provider, verified, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [email, hashedPassword, name, googleId, avatar, provider, verified ? 1 : 0, active ? 1 : 0], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? this.formatUser(row) : null);
        }
      });
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? this.formatUser(row) : null);
        }
      });
    });
  }

  static async findByGoogleId(googleId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE google_id = ?';
      db.get(sql, [googleId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? this.formatUser(row) : null);
        }
      });
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users ORDER BY created_at DESC';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => this.formatUser(row)));
        }
      });
    });
  }

  static async update(id, updateData) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(new Date().toISOString()); // updated_at
      values.push(id); // WHERE id = ?
      
      const sql = `UPDATE users SET ${fields}, updated_at = ? WHERE id = ?`;
      
      db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static async updateLastLogin(id) {
    return this.update(id, { last_login_at: new Date().toISOString() });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM users WHERE id = ?';
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static formatUser(row) {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      googleId: row.google_id,
      avatar: row.avatar,
      provider: row.provider,
      verified: Boolean(row.verified),
      active: Boolean(row.active),
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async seedTestUsers() {
    const testUsers = [
      {
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        provider: 'local',
        verified: true,
        active: true
      },
      {
        email: 'user@example.com',
        password: 'password123',
        name: 'Regular User',
        provider: 'local',
        verified: true,
        active: true
      },
      {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        provider: 'local',
        verified: true,
        active: true
      },
      {
        email: 'unconfirmed@example.com',
        password: 'password123',
        name: 'Unconfirmed User',
        provider: 'local',
        verified: false,
        active: false
      }
    ];

    for (const userData of testUsers) {
      try {
        const existingUser = await this.findByEmail(userData.email);
        if (!existingUser) {
          await this.create(userData);
          console.log(`Created test user: ${userData.email}`);
        }
      } catch (error) {
        console.error(`Error creating test user ${userData.email}:`, error.message);
      }
    }
  }
}

module.exports = User; 