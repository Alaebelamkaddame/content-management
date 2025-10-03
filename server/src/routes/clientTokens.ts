import { Router } from 'express';
import { ClientTokensController } from '../controllers/clientTokensController';

const router = Router();
const clientTokensController = new ClientTokensController();

router.get('/', clientTokensController.getAllClientTokens);
router.get('/project/:projectId', clientTokensController.getClientTokensByProject);
router.get('/validate/:token', clientTokensController.validateClientToken);
router.post('/', clientTokensController.createClientToken);
router.delete('/:id', clientTokensController.deleteClientToken);

export default router;