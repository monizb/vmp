import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database.js';
import { User } from '../models/User.js';

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES || '7d';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

export class AuthService {
  constructor() {
    this.refreshCollectionName = 'refresh_tokens';
  }

  async getUsersCollection() {
    const db = await getDatabase();
    return db.collection('users');
  }

  async getRefreshCollection() {
    const db = await getDatabase();
    return db.collection(this.refreshCollectionName);
  }

  async validateUserCredentials(email, password) {
    const users = await this.getUsersCollection();
    const doc = await users.findOne({ email });
    if (!doc) return null;
    const user = User.fromMongo(doc);
    if (!doc.passwordHash) return null;
    const isValid = await bcrypt.compare(password, doc.passwordHash);
    if (!isValid) return null;
    return user.toJSON();
  }

  signAccessToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      teamIds: user.teamIds,
    };
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  }

  signRefreshToken(user) {
    const payload = { sub: user.id, tokenType: 'refresh' };
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
  }

  async persistRefreshToken(userId, refreshToken) {
    const refreshTokens = await this.getRefreshCollection();
    await refreshTokens.createIndex({ userId: 1 });
    await refreshTokens.insertOne({
      userId,
      token: refreshToken,
      createdAt: new Date(),
    });
  }

  async revokeRefreshToken(refreshToken) {
    const refreshTokens = await this.getRefreshCollection();
    await refreshTokens.deleteOne({ token: refreshToken });
  }

  async rotateRefreshToken(oldToken) {
    const data = this.verifyRefreshToken(oldToken);
    const refreshTokens = await this.getRefreshCollection();
    const existing = await refreshTokens.findOne({ token: oldToken });
    if (!existing) throw new Error('Invalid refresh token');
    await refreshTokens.deleteOne({ token: oldToken });
    const newToken = jwt.sign({ sub: data.sub, tokenType: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
    await refreshTokens.insertOne({ userId: data.sub, token: newToken, createdAt: new Date() });
    return { userId: data.sub, refreshToken: newToken };
  }

  verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
  }

  verifyRefreshToken(token) {
    const payload = jwt.verify(token, REFRESH_SECRET);
    if (payload.tokenType !== 'refresh') throw new Error('Invalid token type');
    return payload;
  }
}

