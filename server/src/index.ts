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

// --- Projects Routes ---
apiRouter.get('/projects', authenticate, async (req, res) => {
    const projects = await prisma.projects.findMany();
    res.json(projects);
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

apiRouter.post('/projects/:projectId/client-token', authenticate, async (req, res) => {
    await prisma.client_tokens.deleteMany({ where: { project_id: req.params.projectId } });
    const token = await prisma.client_tokens.create({ data: { project_id: req.params.projectId } });
    res.status(201).json(token);
});

// --- Content Routes (Complete Implementation) ---
apiRouter.get('/content', authenticate, async (req, res) => {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId) where.project_id = projectId as string;
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

startServer();