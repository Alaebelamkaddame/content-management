import { Request, Response } from 'express';
import { UsersService } from '../services/usersService';
import { CreateUserRequest, UpdateUserRequest } from '../modules/user';

const usersService = new UsersService();

export class UsersController {
  //getAllUsers methode
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await usersService.getAllUsers(); // simple get methode
      //sending the data
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  //get methode by id
  async getUserById(req: Request, res: Response) {
    try {
      // request id params
      const { id } = req.params;
      // get user using id
      const user = await usersService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //post methde to create a new user
  async createUser(req: Request, res: Response) {
    try {
      const userData: CreateUserRequest = req.body;
      
      // Basic validation
      if (!userData.username || !userData.password || !userData.role || !userData.full_name || !userData.email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      // storing the user in a const
      const user = await usersService.createUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //put methode to update user
  async updateUser(req: Request, res: Response) {
    try {
      //get id from params
      const { id } = req.params;
      //request the user from the body
      const userData: UpdateUserRequest = req.body;
      // store in it in a const user
      const user = await usersService.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //delete methode to delete user 
  async deleteUser(req: Request, res: Response) {
    try {
      // get the id from params
      const { id } = req.params;
      const deleted = await usersService.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}