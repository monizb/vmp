import { ObjectId } from 'mongodb';

export class Team {
  constructor(data = {}) {
    this._id = data._id ? new ObjectId(data._id) : new ObjectId();
    this.name = data.name || '';
    this.platform = data.platform || 'Web';
    this.applicationIds = data.applicationIds || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static fromMongo(doc) {
    if (!doc) return null;
    return new Team({
      _id: doc._id,
      name: doc.name,
      platform: doc.platform,
      applicationIds: doc.applicationIds,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toMongo() {
    return {
      _id: this._id,
      name: this.name,
      platform: this.platform,
      applicationIds: this.applicationIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return {
      id: this._id.toString(),
      name: this.name,
      platform: this.platform,
      applicationIds: this.applicationIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 