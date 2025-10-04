import pool from '../config/database';
import { User, CreateUserRequest, UpdateUserRequest } from '../modules/user';
import bcrypt from 'bcryptjs';

export class UsersService {
  async getAllUsers(): Promise<User[]> {
    const result = await pool.query('SELECT id, username, role, full_name, avatar_url, email, created_at, updated_at FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, username, role, full_name, avatar_url, email, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const { username, password, role, full_name, avatar_url, email } = userData;
    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, full_name, avatar_url, email) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, role, full_name, avatar_url, email, created_at, updated_at`,
      [username, password_hash, role, full_name, avatar_url || '', email]
    );

    return result.rows[0];
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.username) {
      fields.push(`username = $${paramCount}`);
      values.push(userData.username);
      paramCount++;
    }
    if (userData.role) {
      fields.push(`role = $${paramCount}`);
      values.push(userData.role);
      paramCount++;
    }
    if (userData.full_name) {
      fields.push(`full_name = $${paramCount}`);
      values.push(userData.full_name);
      paramCount++;
    }
    if (userData.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramCount}`);
      values.push(userData.avatar_url);
      paramCount++;
    }
    if (userData.email) {
      fields.push(`email = $${paramCount}`);
      values.push(userData.email);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, username, role, full_name, avatar_url, email, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }
}