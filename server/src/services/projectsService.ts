import pool from '../config/database';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../modules/Project';
import { ProjectAssignment, CreateProjectAssignmentRequest } from '../modules/ProjectAssignment';

export class ProjectsService {
  async getAllProjects(): Promise<Project[]> {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows;
  }

  async getProjectById(id: string): Promise<Project | null> {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const { id, name, description, archived } = projectData;
    
    const result = await pool.query(
      `INSERT INTO projects (id, name, description, archived) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [id, name, description || '', archived || false]
    );

    return result.rows[0];
  }

  async updateProject(id: string, projectData: UpdateProjectRequest): Promise<Project | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (projectData.name) {
      fields.push(`name = $${paramCount}`);
      values.push(projectData.name);
      paramCount++;
    }
    if (projectData.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(projectData.description);
      paramCount++;
    }
    if (projectData.archived !== undefined) {
      fields.push(`archived = $${paramCount}`);
      values.push(projectData.archived);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.getProjectById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Project Assignments
  async getProjectAssignments(projectId: string): Promise<ProjectAssignment[]> {
    const result = await pool.query(
      'SELECT * FROM project_assignments WHERE project_id = $1',
      [projectId]
    );
    return result.rows;
  }

  async assignUserToProject(assignmentData: CreateProjectAssignmentRequest): Promise<ProjectAssignment> {
    const { project_id, user_id } = assignmentData;
    
    const result = await pool.query(
      `INSERT INTO project_assignments (project_id, user_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [project_id, user_id]
    );

    return result.rows[0];
  }

  async removeUserFromProject(assignmentId: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM project_assignments WHERE id = $1', [assignmentId]);
    return (result.rowCount ?? 0) > 0;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const result = await pool.query(
      `SELECT p.* FROM projects p
       JOIN project_assignments pa ON p.id = pa.project_id
       WHERE pa.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}