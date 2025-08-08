import { AuthService } from '../services/AuthService.js';
import { getDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { ObjectId } from 'mongodb';

export async function authenticateUser(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'No valid authorization header' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const authService = new AuthService();
    const decoded = authService.verifyAccessToken(token);
    const db = await getDatabase();
    const userCollection = db.collection('users');
    const userDoc = await userCollection.findOne({ _id: new ObjectId(decoded.sub) });
    if (!userDoc) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not found in database' });
    }
    const user = User.fromMongo(userDoc);
    request.user = user.toJSON();
    
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.code(401).send({ 
      error: 'Unauthorized', 
      message: 'Invalid token' 
    });
  }
}

export function requireRole(allowedRoles) {
  return async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: 'Insufficient permissions' 
      });
    }
  };
}

export function requireTeamAccess() {
  return async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    // Admin and Security roles have access to all teams
    if (['Admin', 'Security'].includes(request.user.role)) {
      return;
    }

    // For other roles, check if they have access to the requested team
    const teamId = request.params.teamId || request.body.teamId;
    if (teamId && !request.user.teamIds.includes(teamId)) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: 'Access to this team is not allowed' 
      });
    }
  };
} 