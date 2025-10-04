import { Request, Response } from 'express';
import { ContentItemsService } from '../services/contentItemsService';
import { CreateContentItemRequest, UpdateContentItemRequest } from '../modules/ContentItem';

const contentItemsService = new ContentItemsService();

export class ContentItemsController {
  // get methode for content
  async getAllContentItems(req: Request, res: Response) {
    try {
      const { projectId } = req.query;
      const contentItems = await contentItemsService.getAllContentItems(projectId as string);
      res.json(contentItems);
    } catch (error) {
      console.error('Error fetching content items:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // get content using {id}
  async getContentItemById(req: Request, res: Response) {
    try {
      const { id } = req.params; //requesting id by params
      //storing  it in a const
      const contentItem = await contentItemsService.getContentItemById(id); 
      
      //validation
      if (!contentItem) {
        return res.status(404).json({ error: 'Content item not found' });
      }
      
      res.json(contentItem);
    } catch (error) {
      console.error('Error fetching content item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // create Content item
  async createContentItem(req: Request, res: Response) {
    // try catch for handling  
    try {
      //requesting data from the body aka front-end
      const contentData: CreateContentItemRequest = req.body;
      
      // if statement for handling errors
      if (!contentData.project_id || !contentData.type || !contentData.start_date) {
        return res.status(400).json({ error: 'Missing required fields: project_id, type, and start_date' });
      }

      //store the data in a const
      const contentItem = await contentItemsService.createContentItem(contentData);
      res.status(201).json(contentItem);
      //handlin error
    } catch (error: any) {
      console.error('Error creating content item:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid project_id or assignee_id' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //put methode to update content
  async updateContentItem(req: Request, res: Response) {
    try {
      //getting the id from params
      const { id } = req.params; 
      const contentData: UpdateContentItemRequest = req.body;
      // storing the content in a const contentItem
      const contentItem = await contentItemsService.updateContentItem(id, contentData);
      
      if (!contentItem) {
        return res.status(404).json({ error: 'Content item not found' });
      }
      
      res.json(contentItem);
      //catch for handling error
    } catch (error: any) {
      console.error('Error updating content item:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid assignee_id' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  //delete methode to delete the content
  async deleteContentItem(req: Request, res: Response) {
    try {
      //Getting the id from params
      const { id } = req.params;
      const deleted = await contentItemsService.deleteContentItem(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Content item not found' });
      }
      res.status(204).send();
      //catch for handling the error
    } catch (error) {
      console.error('Error deleting content item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //get methode using a date range filter
  async getContentItemsByDateRange(req: Request, res: Response) {
    try {
      //getting the data from query
      const { startDate, endDate, projectId } = req.query;
      //handling empty data
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required query parameters: startDate and endDate' });
      }
      //getting the data and store it in contentItems variable
      const contentItems = await contentItemsService.getContentItemsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
        projectId as string
      );
      
      res.json(contentItems);
    } catch (error) {
      console.error('Error fetching content items by date range:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}