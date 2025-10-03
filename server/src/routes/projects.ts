import { Router } from 'express';
import { ProjectsController } from '../controllers/projectsController';

const router = Router();
const projectsController = new ProjectsController();

// Projects routes
router.get('/', projectsController.getAllProjects); //localhost/api
router.get('/:id', projectsController.getProjectById);
router.post('/', projectsController.createProject);
router.put('/:id', projectsController.updateProject);