import { authenticateUser } from '../middleware/auth.js';
import { SavedViewService } from '../services/SavedViewService.js';

export default async function viewRoutes(fastify, options) {
  const viewService = new SavedViewService();

  fastify.addHook('preHandler', authenticateUser);

  fastify.get('/views', async (request, reply) => {
    try {
      const { entityType } = request.query;
      const views = await viewService.getAllForUser(request.user.id, { entityType });
      return views;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  fastify.post('/views', async (request, reply) => {
    try {
      const { name, entityType = 'vulns', filters = {} } = request.body;
      if (!name) {
        return reply.code(400).send({ error: 'Bad request', message: 'Name is required' });
      }
      const view = await viewService.create(request.user.id, { name, entityType, filters });
      reply.code(201).send(view);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  fastify.patch('/views/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const update = request.body;
      const view = await viewService.update(id, request.user.id, update);
      if (!view) {
        return reply.code(404).send({ error: 'Not found', message: 'View not found' });
      }
      return view;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  fastify.delete('/views/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await viewService.delete(id, request.user.id);
      if (!deleted) {
        return reply.code(404).send({ error: 'Not found', message: 'View not found' });
      }
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });
}

