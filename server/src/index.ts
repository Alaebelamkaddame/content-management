import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import { validate as uuidValidate } from 'uuid';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Type Definitions for JWT Payload ---
interface UserPayload {
    id: string;
    role: string;
}

// --- ✅ ADDED: Payload for Client-Specific JWT ---
interface ClientTokenPayload {
    projectId: string;
    type: 'client';
}

interface AuthRequest extends Request {
    user?: UserPayload;
}

// --- Authentication Middleware ---
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or malformed Bearer token' });
    }
    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: 'Invalid token provided.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const authorize = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role?.trim() || 'none';
    if (!req.user || !roles.includes(userRole)) {
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
  const token = jwt.sign({ id: user.id, role: user.role.trim() }, process.env.JWT_SECRET as string, { expiresIn: '8h' });
  res.json({ token });
});

// --- Users Routes ---
apiRouter.get('/users/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid UUID for user ID' });
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

apiRouter.get('/users', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    res.json(await prisma.users.findMany({ orderBy: { full_name: 'asc' } }));
});

apiRouter.post('/users', authenticate, authorize('admin'), async (req, res) => {
    const { username, password, role, full_name, email } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({ data: { username, password_hash, role, full_name, email } });
    const { password_hash: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

// --- Projects Routes ---
apiRouter.get('/projects', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    res.json(await prisma.projects.findMany({ orderBy: { name: 'asc' } }));
});

apiRouter.get('/projects/assigned', authenticate, authorize('admin', 'team_leader', 'team_member'), async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "User not found." });
    const assignments = await prisma.project_assignments.findMany({
        where: { user_id: req.user.id },
        include: { project: true },
    });
    res.json(assignments.map(a => a.project));
});

apiRouter.get('/projects/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid project ID' });
    const project = await prisma.projects.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
});

// --- ✅ FIX: Add route to create and get a client token for a project ---
apiRouter.get('/projects/:id/client-token', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    const { id } = req.params;
    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid project ID format' });

    try {
        const project = await prisma.projects.findUnique({ where: { id } });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Generate a long-lived token specifically for this client project view
        const clientToken = jwt.sign(
            { projectId: project.id, type: 'client' },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' } // The client link will be valid for 30 days
        );

        res.json({ token: clientToken });

    } catch (error) {
        console.error('Error generating client token:', error);
        res.status(500).json({ message: 'Could not generate client token.' });
    }
});


apiRouter.post('/projects', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    const { name, userIds } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });
    const newProject = await prisma.$transaction(async (tx) => {
        const project = await tx.projects.create({ data: { name } });
        if (userIds?.length) {
            await tx.project_assignments.createMany({
                data: userIds.map((userId: string) => ({ project_id: project.id, user_id: userId })),
            });
        }
        return project;
    });
    res.status(201).json(newProject);
});

apiRouter.delete('/projects/:id', authenticate, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid project ID format' });
    await prisma.$transaction(async (tx) => {
        await tx.project_assignments.deleteMany({ where: { project_id: id } });
        await tx.projects.delete({ where: { id } });
    });
    res.status(204).send();
});

// --- Content Routes ---
apiRouter.get('/content/my-assignments', authenticate, authorize('team_member'), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "User not found." });
        const assignedContent = await prisma.content_items.findMany({
            where: { assignee_id: req.user.id },
            orderBy: { start_date: 'asc' }
        });
        res.json(assignedContent);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch assigned content." });
    }
});

apiRouter.get('/content', authenticate, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "User not found." });
    const { projectId } = req.query;
    if (!projectId || typeof projectId !== 'string') return res.status(400).json({ message: "Project ID is required." });

    const where: any = { project_id: projectId };
    res.json(await prisma.content_items.findMany({ where }));
});

apiRouter.post('/content', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    const { start_date, end_date, assignee_id, ...restOfData } = req.body;
    if (!restOfData.project_id) return res.status(400).json({ message: 'Project ID is required.' });
    const data = {
        ...restOfData,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : null,
        assignee_id: assignee_id || null,
    };
    res.status(201).json(await prisma.content_items.create({ data }));
});

apiRouter.put('/content/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid content ID' });
    const { start_date, end_date, assignee_id, ...updates } = req.body;
    const data: any = { ...updates };
    if (start_date !== undefined) data.start_date = start_date ? new Date(start_date) : null;
    if (end_date !== undefined) data.end_date = end_date ? new Date(end_date) : null;
    if (assignee_id !== undefined) data.assignee_id = assignee_id || null;
    res.json(await prisma.content_items.update({ where: { id }, data }));
});

apiRouter.delete('/content/:id', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
    const { id } = req.params;
    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid content ID' });
    await prisma.content_items.delete({ where: { id } });
    res.status(204).send();
});

// --- Mount Router & Start Server ---
app.use('/api', apiRouter);
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));