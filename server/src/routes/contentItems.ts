import { Router } from 'express';
import { ContentItemsController } from '../controllers/contentItemsController';

const router = Router();
const contentItemsController = new ContentItemsController();

router.get('/', contentItemsController.getAllContentItems);
router.get('/date-range', contentItemsController.getContentItemsByDateRange);
router.get('/:id', contentItemsController.getContentItemById);
router.post('/', contentItemsController.createContentItem);
router.put('/:id', contentItemsController.updateContentItem);
router.delete('/:id', contentItemsController.deleteContentItem);

export default router;