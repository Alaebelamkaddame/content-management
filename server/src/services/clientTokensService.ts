import pool from '../config/database';
import { ClientToken, CreateClientTokenRequest } from '../modules/ClientToken';
import { v4 as uuidv4 } from 'uuid';

export class ClientTokensService {
  async getAllClientTokens(): Promise<ClientToken[]> {
    const result = await pool.query('SELECT * FROM client_tokens ORDER BY created_at DESC');
    return result.rows;
  }

  async getClientTokenById(id: string): Promise<ClientToken | null> {
    const result = await pool.query('SELECT * FROM client_tokens WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getClientTokenByToken(token: string): Promise<ClientToken | null> {
    const result = await pool.query('SELECT * FROM client_tokens WHERE token = $1', [token]);
    return result.rows[0] || null;
  }

  async createClientToken(tokenData: CreateClientTokenRequest): Promise<ClientToken> {
    const { project_id } = tokenData;
    const token = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO client_tokens (project_id, token) 
       VALUES ($1, $2) 
       RETURNING *`,
      [project_id, token]
    );

    return result.rows[0];
  }

  async deleteClientToken(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM client_tokens WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getClientTokensByProject(projectId: string): Promise<ClientToken[]> {
    const result = await pool.query(
      'SELECT * FROM client_tokens WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    return result.rows;
  }
}