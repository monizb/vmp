import { getDatabase } from '../config/database.js';
import { SavedView } from '../models/SavedView.js';
import { ObjectId } from 'mongodb';

export class SavedViewService {
  constructor() {
    this.collectionName = 'saved_views';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  async getAllForUser(ownerUserId, filters = {}) {
    const collection = await this.getCollection();
    const query = { ownerUserId: new ObjectId(ownerUserId) };
    if (filters.entityType) query.entityType = filters.entityType;
    const views = await collection.find(query).sort({ updatedAt: -1 }).toArray();
    return views.map((v) => SavedView.fromMongo(v).toJSON());
  }

  async getById(id) {
    const collection = await this.getCollection();
    const view = await collection.findOne({ _id: new ObjectId(id) });
    return view ? SavedView.fromMongo(view).toJSON() : null;
  }

  async create(ownerUserId, viewData) {
    const collection = await this.getCollection();
    const view = new SavedView({ ...viewData, ownerUserId });
    const result = await collection.insertOne(view.toMongo());
    return SavedView.fromMongo({ ...view.toMongo(), _id: result.insertedId }).toJSON();
  }

  async update(id, ownerUserId, viewData) {
    const collection = await this.getCollection();
    const updateData = { ...viewData, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), ownerUserId: new ObjectId(ownerUserId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result.value ? SavedView.fromMongo(result.value).toJSON() : null;
  }

  async delete(id, ownerUserId) {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id), ownerUserId: new ObjectId(ownerUserId) });
    return result.deletedCount > 0;
  }
}

