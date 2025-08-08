import { ObjectId } from 'mongodb';

export class Application {
  constructor(data = {}) {
    this._id = data._id ? new ObjectId(data._id) : new ObjectId();
    this.name = data.name || '';
    this.platform = data.platform || 'Web';
    this.teamId = data.teamId ? new ObjectId(data.teamId) : null;
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static fromMongo(doc) {
    if (!doc) return null;
    return new Application({
      _id: doc._id,
      name: doc.name,
      platform: doc.platform,
      teamId: doc.teamId,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toMongo() {
    return {
      _id: this._id,
      name: this.name,
      platform: this.platform,
      teamId: this.teamId,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return {
      id: this._id.toString(),
      name: this.name,
      platform: this.platform,
      teamId: this.teamId ? this.teamId.toString() : null,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 