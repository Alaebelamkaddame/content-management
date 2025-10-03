import { Request, Response } from 'express';
import { ClientTokensService } from '../services/clientTokensService';
import { CreateClientTokenRequest } from '../modules/ClientToken';

const clientTokensService = new ClientTokensService();

export class ClientTokensController {
  async getAllClientTokens(req: Request, res: Response) {
    try {
      const tokens = await clientTokensService.getAllClientTokens();
      res.json(tokens);
    } catch (error) {
      console.error('Error fetching client tokens:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getClientTokenById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const token = await clientTokensService.getClientTokenById(id);
      
      if (!token) {
        return res.status(404).json({ error: 'Client token not found' });
      }
      
      res.json(token);
    } catch (error) {
      console.error('Error fetching client token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createClientToken(req: Request, res: Response) {
    try {
      const tokenData: CreateClientTokenRequest = req.body;
      
      if (!tokenData.project_id) {
        return res.status(400).json({ error: 'Missing required field: project_id' });
      }

      const token = await clientTokensService.createClientToken(tokenData);
      res.status(201).json(token);
    } catch (error: any) {
      console.error('Error creating client token:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid project_id' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteClientToken(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await clientTokensService.deleteClientToken(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Client token not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting client token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getClientTokensByProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const tokens = await clientTokensService.getClientTokensByProject(projectId);
      res.json(tokens);
    } catch (error) {
      console.error('Error fetching client tokens by project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async validateClientToken(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const clientToken = await clientTokensService.getClientTokenByToken(token);
      
      if (!clientToken) {
        return res.status(404).json({ error: 'Invalid token' });
      }
      
      res.json({ valid: true, project_id: clientToken.project_id });
    } catch (error) {
      console.error('Error validating client token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}