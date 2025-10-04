import pool from '../config/database';
import { ContentItem, CreateContentItemRequest, UpdateContentItemRequest } from '../modules/ContentItem';

export class ContentItemsService {
  async getAllContentItems(projectId?: string): Promise<ContentItem[]> {
    let query = 'SELECT * FROM content_items';
    const values = [];

    if (projectId) {
      query += ' WHERE project_id = $1';
      values.push(projectId);
    }

    query += ' ORDER BY start_date DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  async getContentItemById(id: string): Promise<ContentItem | null> {
    const result = await pool.query('SELECT * FROM content_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async createContentItem(contentData: CreateContentItemRequest): Promise<ContentItem> {
    const {
      project_id,
      title,
      caption,
      type,
      platforms,
      status,
      assignee_id,
      start_date,
      end_date,
      assets,
      notes_internal,
      notes_client
    } = contentData;
    
    const result = await pool.query(
      `INSERT INTO content_items (
        project_id, title, caption, type, platforms, status, assignee_id, 
        start_date, end_date, assets, notes_internal, notes_client
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        project_id,
        title || '',
        caption || '',
        type,
        platforms || [],
        status || 'idea',
        assignee_id || null,
        start_date,
        end_date || null,
        assets || [],
        notes_internal || '',
        notes_client || ''
      ]
    );

    return result.rows[0];
  }

  async updateContentItem(id: string, contentData: UpdateContentItemRequest): Promise<ContentItem | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (contentData.title !== undefined) {
      fields.push(`title = $${paramCount}`);
      values.push(contentData.title);
      paramCount++;
    }
    if (contentData.caption !== undefined) {
      fields.push(`caption = $${paramCount}`);
      values.push(contentData.caption);
      paramCount++;
    }
    if (contentData.type) {
      fields.push(`type = $${paramCount}`);
      values.push(contentData.type);
      paramCount++;
    }
    if (contentData.platforms !== undefined) {
      fields.push(`platforms = $${paramCount}`);
      values.push(contentData.platforms);
      paramCount++;
    }
    if (contentData.status) {
      fields.push(`status = $${paramCount}`);
      values.push(contentData.status);
      paramCount++;
    }
    if (contentData.assignee_id !== undefined) {
      fields.push(`assignee_id = $${paramCount}`);
      values.push(contentData.assignee_id);
      paramCount++;
    }
    if (contentData.start_date) {
      fields.push(`start_date = $${paramCount}`);
      values.push(contentData.start_date);
      paramCount++;
    }
    if (contentData.end_date !== undefined) {
      fields.push(`end_date = $${paramCount}`);
      values.push(contentData.end_date);
      paramCount++;
    }
    if (contentData.assets !== undefined) {
      fields.push(`assets = $${paramCount}`);
      values.push(contentData.assets);
      paramCount++;
    }
    if (contentData.notes_internal !== undefined) {
      fields.push(`notes_internal = $${paramCount}`);
      values.push(contentData.notes_internal);
      paramCount++;
    }
    if (contentData.notes_client !== undefined) {
      fields.push(`notes_client = $${paramCount}`);
      values.push(contentData.notes_client);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.getContentItemById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE content_items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteContentItem(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM content_items WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getContentItemsByDateRange(startDate: Date, endDate: Date, projectId?: string): Promise<ContentItem[]> {
    let query = 'SELECT * FROM content_items WHERE start_date >= $1 AND start_date <= $2';
    const values: (Date | string)[] = [startDate, endDate];

    if (projectId) {
      query += ' AND project_id = $3';
      values.push(projectId as string);
    }

    query += ' ORDER BY start_date ASC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }
}