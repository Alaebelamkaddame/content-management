import { Request, Response } from 'express';
import { ProjectsService } from '../services/projectsService';
import { CreateProjectRequest, UpdateProjectRequest } from '../modules/Project';
import { CreateProjectAssignmentRequest } from '../modules/ProjectAssignment';

const projectsService = new ProjectsService();

export class ProjectsController {
  async getAllProjects(req: Request, res: Response) {
    try {
      const projects = await projectsService.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProjectById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = await projectsService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createProject(req: Request, res: Response) {
    try {
      const projectData: CreateProjectRequest = req.body;
      
      if (!projectData.id || !projectData.name) {
        return res.status(400).json({ error: 'Missing required fields: id and name' });
      }

      const project = await projectsService.createProject(projectData);
      res.status(201).json(project);
    } catch (error: any) {
      console.error('Error creating project:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Project ID already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const projectData: UpdateProjectRequest = req.body;
      
      const project = await projectsService.updateProject(id, projectData);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await projectsService.deleteProject(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Project Assignments
  async getProjectAssignments(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const assignments = await projectsService.getProjectAssignments(projectId);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching project assignments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async assignUserToProject(req: Request, res: Response) {
    try {
      const assignmentData: CreateProjectAssignmentRequest = req.body;
      
      if (!assignmentData.project_id || !assignmentData.user_id) {
        return res.status(400).json({ error: 'Missing required fields: project_id and user_id' });
      }

      const assignment = await projectsService.assignUserToProject(assignmentData);
      res.status(201).json(assignment);
    } catch (error: any) {
      console.error('Error assigning user to project:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: 'User is already assigned to this project' });
      }
      
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid project_id or user_id' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeUserFromProject(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const deleted = await projectsService.removeUserFromProject(assignmentId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing user from project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserProjects(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const projects = await projectsService.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}