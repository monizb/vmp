import { ObjectId } from 'mongodb';

export class User {
  constructor(data = {}) {
    this._id = data._id ? new ObjectId(data._id) : new ObjectId();
    this.email = data.email || '';
    this.name = data.name || '';
    this.role = data.role || 'Dev';
    this.teamIds = data.teamIds || [];
    this.passwordHash = data.passwordHash || undefined;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static fromMongo(doc) {
    if (!doc) return null;
    return new User({
      _id: doc._id,
      email: doc.email,
      name: doc.name,
      role: doc.role,
      teamIds: doc.teamIds,
      passwordHash: doc.passwordHash,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toMongo() {
    return {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
      teamIds: this.teamIds,
      passwordHash: this.passwordHash,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return {
      id: this._id.toString(),
      email: this.email,
      name: this.name,
      role: this.role,
      teamIds: this.teamIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 