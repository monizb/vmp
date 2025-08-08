import { ApplicationService } from '../services/ApplicationService.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

export default async function appRoutes(fastify, options) {
  const appService = new ApplicationService();

  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateUser);

  // Get all applications (Admin, Security only)
  fastify.get('/apps', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const filters = {
        teamId: request.query.teamId,
        platform: request.query.platform
      };
      const apps = await appService.getAll(filters);
      return apps;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get application by ID (Admin, Security only)
  fastify.get('/apps/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const app = await appService.getById(id);
      if (!app) {
        return reply.code(404).send({ error: 'Not found', message: 'Application not found' });
      }
      return app;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Create new application (Admin, Security only)
  fastify.post('/apps', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const appData = request.body;
      
      // Validate required fields
      if (!appData.name || !appData.platform) {
        return reply.code(400).send({ 
          error: 'Bad request', 
          message: 'Name and platform are required' 
        });
      }

      const app = await appService.create(appData);
      reply.code(201).send(app);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Update application (Admin, Security only)
  fastify.patch('/apps/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const app = await appService.update(id, updateData);
      if (!app) {
        return reply.code(404).send({ error: 'Not found', message: 'Application not found' });
      }
      
      return app;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Delete application (Admin, Security only)
  fastify.delete('/apps/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await appService.delete(id);
      if (!deleted) {
        return reply.code(404).send({ error: 'Not found', message: 'Application not found' });
      }
      
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get applications by team (Admin, Security only)
  fastify.get('/apps/team/:teamId', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { teamId } = request.params;
      const apps = await appService.getByTeam(teamId);
      return apps;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get applications by platform (Admin, Security only)
  fastify.get('/apps/platform/:platform', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { platform } = request.params;
      const apps = await appService.getByPlatform(platform);
      return apps;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });
} 