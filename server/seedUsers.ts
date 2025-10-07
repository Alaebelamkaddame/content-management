// In some seed script or manually via Prisma Studio
prisma.projects.create({
  data: {
    id: 'demo',
    name: 'Demo Project',
    description: 'This is a demo project',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(), // must provide NOT NULL
  },
});
