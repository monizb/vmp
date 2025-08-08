import bcrypt from 'bcryptjs';
import { AuthService } from '../services/AuthService.js';
import { UserService } from '../services/UserService.js';

export default async function authRoutes(fastify, options) {
  const authService = new AuthService();
  const userService = new UserService();

  fastify.post('/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body || {};
      if (!email || !password) {
        return reply.code(400).send({ error: 'Bad request', message: 'Email and password are required' });
      }

      const user = await authService.validateUserCredentials(email, password);
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
      }

      const accessToken = authService.signAccessToken(user);
      const refreshToken = authService.signRefreshToken(user);
      await authService.persistRefreshToken(user.id, refreshToken);

      return reply.send({
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  fastify.post('/auth/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body || {};
      if (!refreshToken) {
        return reply.code(400).send({ error: 'Bad request', message: 'Refresh token is required' });
      }

      const { userId, refreshToken: rotated } = await authService.rotateRefreshToken(refreshToken);
      const user = await userService.getById(userId);
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User not found' });
      }
      const accessToken = authService.signAccessToken(user);
      return reply.send({ accessToken, refreshToken: rotated });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid refresh token' });
    }
  });

  fastify.post('/auth/logout', async (request, reply) => {
    try {
      const { refreshToken } = request.body || {};
      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }
      return reply.code(204).send();
    } catch (error) {
      return reply.code(200).send();
    }
  });
}

