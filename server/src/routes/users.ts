import { Router } from 'express';
import { UsersController } from '../controllers/usersController';

const router = Router();
const usersController = new UsersController();

router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

export default router;