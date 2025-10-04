import { Request, Response } from 'express';
import { ClientTokensService } from '../services/clientTokensService';
import { CreateClientTokenRequest } from '../modules/ClientToken';

const clientTokensService = new ClientTokensService();

export class ClientTokensController {
  //client get all methode
  async getAllClientTokens(req: Request, res: Response) {
    try {
      const tokens = await clientTokensService.getAllClientTokens(); // getting tokens 
      res.json(tokens);
    } catch (error) { // handling errors
      console.error('Error fetching client tokens:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //Client get token using {id} methode
  async getClientTokenById(req: Request, res: Response) { // get methode for gettin client by ID  
    try {
      const { id } = req.params; // request Id from parameters
      const token = await clientTokensService.getClientTokenById(id); //storing the tokens in a const
      
      if (!token) { //handling case with no token or error
        return res.status(404).json({ error: 'Client token not found' });
      }
      
      res.json(token); // returning response
    } catch (error) {
      console.error('Error fetching client token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // client post methode to create client token 
  async createClientToken(req: Request, res: Response) {
    try {
      const tokenData: CreateClientTokenRequest = req.body; // creating a token
      
      if (!tokenData.project_id) { //handling error
        return res.status(400).json({ error: 'Missing required field: project_id' });
      }

      const token = await clientTokensService.createClientToken(tokenData); //storing the token
      res.status(201).json(token);
    } catch (error: any) {
      console.error('Error creating client token:', error); //handle error or misscase
      
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid project_id' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //Client delete methode
  async deleteClientToken(req: Request, res: Response) {
    try {
      const { id } = req.params; // request client delete
      const deleted = await clientTokensService.deleteClientToken(id);

      //if statement for error handling
      if (!deleted) {
        return res.status(404).json({ error: 'Client token not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting client token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //get method by project
  async getClientTokensByProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params; //taken project id
      //storing the tokens in a const
      const tokens = await clientTokensService.getClientTokensByProject(projectId); 
      res.json(tokens);
    } catch (error) {
      console.error('Error fetching client tokens by project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //validation of a token
  async validateClientToken(req: Request, res: Response) {
    try {
      const { token } = req.params; // requesting token from params
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