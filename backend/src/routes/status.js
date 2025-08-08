export default async function statusRoutes(fastify, options) {
  fastify.get('/status', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });
} 