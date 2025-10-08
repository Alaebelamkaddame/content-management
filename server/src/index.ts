import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Authentication Middleware ---
interface AuthRequest extends Request {
  user?: any;
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Missing token' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const authorize = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};


// --- API Router ---
const apiRouter = express.Router();

// --- Auth Routes ---
apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.users.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '8h' });
  res.json({ token });
});

// --- Users Routes ---
apiRouter.get('/users/:id', authenticate, async (req, res) => {
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

apiRouter.get('/users', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    const users = await prisma.users.findMany({ orderBy: { full_name: 'asc' } });
    res.json(users);
});

apiRouter.post('/users', authenticate, authorize('admin'), async (req, res) => {
    const { username, password, role, full_name, email } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({ data: { username, password_hash, role, full_name, email } });
    const { password_hash: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

apiRouter.get('/users/initial-project', authenticate, authorize('team_member'), async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        
        // Find the first content item assigned to this user
        const firstContentItem = await prisma.content_items.findFirst({
            where: { assignee_id: userId },
            select: { project_id: true } // We only need the ID
        });

        if (firstContentItem) {
            // If we found content, return the project ID
            res.json({ projectId: firstContentItem.project_id });
        } else {
            // If the user is assigned to no content, return null
            res.status(404).json(null);
        }
    } catch (error) {
        console.error("Failed to fetch initial project for team member:", error);
        res.status(500).json({ message: "An error occurred." });
    }
});

// --- Projects Routes ---
apiRouter.get('/projects', authenticate, authorize('admin'), async (req, res) => {
    const projects = await prisma.projects.findMany({ orderBy: { name: 'asc' } });
    res.json(projects);
});

apiRouter.get('/projects/assigned', authenticate, authorize('admin', 'team_leader'), async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const assignments = await prisma.project_assignments.findMany({
            where: { user_id: userId },
            include: { project: true },
        });
        // Note: It's `a.project` (singular)
        const assignedProjects = assignments.map(a => a.project);
        res.json(assignedProjects);
    } catch (error) {
        console.error("Failed to fetch assigned projects:", error);
        res.status(500).json({ message: "An error occurred." });
    }
});

apiRouter.get('/projects/:id/assignments', authenticate, authorize('admin'), async (req, res) => {
    const assignments = await prisma.project_assignments.findMany({
        where: { project_id: req.params.id },
        select: { user_id: true }, // We only need the user IDs
    });
    res.json(assignments.map(a => a.user_id));
});

// PUT (update) the assignments for a project
apiRouter.put('/projects/:id/assignments', authenticate, authorize('admin'), async (req, res) => {
    const projectId = req.params.id;
    const { userIds } = req.body; // Expecting an array of user IDs

    if (!Array.isArray(userIds)) {
        return res.status(400).json({ message: 'userIds must be an array.' });
    }

    try {
        // Use a transaction to safely replace the assignments
        await prisma.$transaction(async (tx) => {
            // 1. Delete all old assignments for this project
            await tx.project_assignments.deleteMany({
                where: { project_id: projectId },
            });

            // 2. Create the new assignments
            if (userIds.length > 0) {
                await tx.project_assignments.createMany({
                    data: userIds.map((uid: string) => ({
                        project_id: projectId,
                        user_id: uid,
                    })),
                });
            }
        });
        res.status(200).json({ message: 'Assignments updated successfully.' });
    } catch (error) {
        console.error('Failed to update assignments:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// DELETE a project
apiRouter.delete('/projects/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        // The transaction ensures that if deleting assignments fails, the project is not deleted.
        await prisma.$transaction(async (tx) => {
            await tx.project_assignments.deleteMany({ where: { project_id: req.params.id }});
            // Note: This will fail if content_items are linked. You need to set up cascading deletes in Prisma.
            await tx.projects.delete({ where: { id: req.params.id } });
        });
        res.status(204).send(); // Success, no content
    } catch (error) {
        console.error('Failed to delete project:', error);
        res.status(500).json({ message: 'Failed to delete project. Make sure all content is removed first.' });
    }
});

apiRouter.get('/projects/:id', authenticate, async (req, res) => {
    const project = await prisma.projects.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
});

// --- Client Token Routes ---
apiRouter.get('/projects/:projectId/client-token', authenticate, async (req, res) => {
    const token = await prisma.client_tokens.findFirst({ where: { project_id: req.params.projectId } });
    if (!token) return res.status(404).json({ message: 'Token not found' });
    res.json(token);
});

apiRouter.post('/projects', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const newProject = await prisma.projects.create({
            data: {
                name: name,
            },
        });

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Failed to create project:', error);
        res.status(500).json({ message: 'An error occurred while creating the project.' });
    }
});

apiRouter.post('/projects/:projectId/client-token', authenticate, async (req, res) => {
    await prisma.client_tokens.deleteMany({ where: { project_id: req.params.projectId } });
    const token = await prisma.client_tokens.create({ data: { project_id: req.params.projectId } });
    res.status(201).json(token);
});

apiRouter.post('/projects', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    try {
        // Now expecting 'name' and an optional 'userIds' array
        const { name, userIds } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        // Use a transaction to create the project and assignments together
        const newProject = await prisma.$transaction(async (tx) => {
            // 1. Create the project
            const project = await tx.projects.create({
                data: { name },
            });

            // 2. If user IDs were provided, create the assignments
            if (userIds && Array.isArray(userIds) && userIds.length > 0) {
                await tx.project_assignments.createMany({
                    data: userIds.map((userId: string) => ({
                        project_id: project.id,
                        user_id: userId,
                    })),
                });
            }

            return project;
        });

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Failed to create project with assignments:', error);
        res.status(500).json({ message: 'An error occurred while creating the project.' });
    }
});

// --- Content Routes (Complete Implementation) ---
apiRouter.get('/content', authenticate, async (req: AuthRequest, res) => {
    const { projectId } = req.query;
    const { id: userId, role } = req.user!;

    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required." });
    }

    const where: any = { project_id: projectId as string };

    if (role === 'team_member') {
        where.assignee_id = userId;
    }

    const items = await prisma.content_items.findMany({ where });
    res.json(items);
});

apiRouter.post('/content', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    const { start_date, end_date, assignee_id, ...restOfData } = req.body;
    if (!restOfData.project_id) {
        return res.status(400).json({ message: 'Project ID is required.' });
    }
    const dataForPrisma = {
        ...restOfData,
        start_date: start_date ? new Date(start_date).toISOString() : undefined,
        end_date: end_date ? new Date(end_date).toISOString() : null,
        assignee_id: assignee_id || null,
    };
    try {
        const newItem = await prisma.content_items.create({
            // @ts-ignore
            data: dataForPrisma,
        });
        res.status(201).json(newItem);
    } catch (error) {
        console.error("Failed to create content item:", error);
        res.status(500).json({ message: "An error occurred while creating the content item." });
    }
});

apiRouter.put('/content/:id', authenticate, async (req, res) => {
    const { start_date, end_date, assignee_id, ...updates } = req.body;
    const dataForPrisma: any = { ...updates };
    if (start_date !== undefined) {
      dataForPrisma.start_date = start_date ? new Date(start_date).toISOString() : null;
    }
    if (end_date !== undefined) {
      dataForPrisma.end_date = end_date ? new Date(end_date).toISOString() : null;
    }
    if (assignee_id !== undefined) {
      dataForPrisma.assignee_id = assignee_id || null;
    }
    try {
        const updatedItem = await prisma.content_items.update({
            where: { id: req.params.id },
            data: dataForPrisma,
        });
        res.json(updatedItem);
    } catch (error) {
        console.error(`Failed to update content item ${req.params.id}:`, error);
        res.status(404).json({ message: 'Content item not found or update failed.' });
    }
});

apiRouter.delete('/content/:id', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    try {
        await prisma.content_items.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        res.status(404).json({ message: 'Content item not found.' });
    }
});

// --- Mount Router & Start Server ---
app.use('/api', apiRouter);

async function startServer() {
 
  app.listen(PORT, () => {
    console.log(`🚀 API server is running on http://localhost:${PORT}`);
  });
}

startServer() ; 