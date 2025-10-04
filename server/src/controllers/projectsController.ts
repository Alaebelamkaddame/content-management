import { Request, Response } from 'express';
import { ProjectsService } from '../services/projectsService';
import { CreateProjectRequest, UpdateProjectRequest } from '../modules/Project';
import { CreateProjectAssignmentRequest } from '../modules/ProjectAssignment';

const projectsService = new ProjectsService();

export class ProjectsController { 
  // simple get methode with it's error handling 
  async getAllProjects(req: Request, res: Response) {
    try {
      const projects = await projectsService.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // get methode using Id 
  async getProjectById(req: Request, res: Response) {
    try {
      // requesting the id by params
      const { id } = req.params;
      const project = await projectsService.getProjectById(id);
      
      // handling errors
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // post methode to create project
  async createProject(req: Request, res: Response) {
    // try catch methode
    try {
      //requesting data from the body 
      const projectData: CreateProjectRequest = req.body;
      
      if (!projectData.id || !projectData.name) {
        return res.status(400).json({ error: 'Missing required fields: id and name' });
      }
      // creating the project
      const project = await projectsService.createProject(projectData);
      res.status(201).json(project);
      // catch error methode
    } catch (error: any) {
      console.error('Error creating project:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Project ID already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // put methode to update
  async updateProject(req: Request, res: Response) {
    try {
      //requesting id from params
      const { id } = req.params;
      const projectData: UpdateProjectRequest = req.body;
      
      //saving the updates data in a const project
      const project = await projectsService.updateProject(id, projectData);
      //handling errors
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //delete methode for project
  async deleteProject(req: Request, res: Response) {
    try {
      //getting the project id
      const { id } = req.params;
      //deleting the project
      const deleted = await projectsService.deleteProject(id);
      //if statement for error handling
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
    // try ctach methode for handling errors
    try {
      //getting the projectId from params
      const { projectId } = req.params;
      //store assignment in a const
      const assignments = await projectsService.getProjectAssignments(projectId);
      res.json(assignments);
      //catch error
    } catch (error) {
      console.error('Error fetching project assignments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //assing user to project
  async assignUserToProject(req: Request, res: Response) {
    //try catch methode
    try {
      //request the data from body
      const assignmentData: CreateProjectAssignmentRequest = req.body;
      
      if (!assignmentData.project_id || !assignmentData.user_id) {
        return res.status(400).json({ error: 'Missing required fields: project_id and user_id' });
      }
      //store it in a const
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

  //delete methode to remove a user from a project
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

  // get methode to get a user project
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