import { ObjectId } from 'mongodb';

export class SavedView {
  constructor(data = {}) {
    this._id = data._id ? new ObjectId(data._id) : new ObjectId();
    this.name = data.name || '';
    this.entityType = data.entityType || 'vulns';
    this.filters = data.filters || {};
    this.ownerUserId = data.ownerUserId ? new ObjectId(data.ownerUserId) : null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static fromMongo(doc) {
    if (!doc) return null;
    return new SavedView({
      _id: doc._id,
      name: doc.name,
      entityType: doc.entityType,
      filters: doc.filters,
      ownerUserId: doc.ownerUserId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toMongo() {
    return {
      _id: this._id,
      name: this.name,
      entityType: this.entityType,
      filters: this.filters,
      ownerUserId: this.ownerUserId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return {
      id: this._id.toString(),
      name: this.name,
      entityType: this.entityType,
      filters: this.filters,
      ownerUserId: this.ownerUserId ? this.ownerUserId.toString() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

