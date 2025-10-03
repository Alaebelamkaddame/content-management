import { Request, Response } from 'express';
import { ContentItemsService } from '../services/contentItemsService';
import { CreateContentItemRequest, UpdateContentItemRequest } from '../modules/ContentItem';

const contentItemsService = new ContentItemsService();

export class ContentItemsController {
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

  async getContentItemById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const contentItem = await contentItemsService.getContentItemById(id);
      
      if (!contentItem) {
        return res.status(404).json({ error: 'Content item not found' });
      }
      
      res.json(contentItem);
    } catch (error) {
      console.error('Error fetching content item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createContentItem(req: Request, res: Response) {
    try {
      const contentData: CreateContentItemRequest = req.body;
      
      if (!contentData.project_id || !contentData.type || !contentData.start_date) {
        return res.status(400).json({ error: 'Missing required fields: project_id, type, and start_date' });
      }

      const contentItem = await contentItemsService.createContentItem(contentData);
      res.status(201).json(contentItem);
    } catch (error: any) {
      console.error('Error creating content item:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid project_id or assignee_id' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateContentItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const contentData: UpdateContentItemRequest = req.body;
      
      const contentItem = await contentItemsService.updateContentItem(id, contentData);
      
      if (!contentItem) {
        return res.status(404).json({ error: 'Content item not found' });
      }
      
      res.json(contentItem);
    } catch (error: any) {
      console.error('Error updating content item:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid assignee_id' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteContentItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await contentItemsService.deleteContentItem(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Content item not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting content item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getContentItemsByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate, projectId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required query parameters: startDate and endDate' });
      }

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