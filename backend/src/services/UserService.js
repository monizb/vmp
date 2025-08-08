import { getDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export class UserService {
  constructor() {
    this.collectionName = 'users';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  async getAll() {
    const collection = await this.getCollection();
    const users = await collection.find({}).toArray();
    return users.map(user => User.fromMongo(user).toJSON());
  }

  async getById(id) {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(id) });
    return user ? User.fromMongo(user).toJSON() : null;
  }

  async getByEmail(email) {
    const collection = await this.getCollection();
    const user = await collection.findOne({ email });
    return user ? User.fromMongo(user).toJSON() : null;
  }

  async create(userData) {
    const collection = await this.getCollection();
    const toCreate = { ...userData };
    if (toCreate.password) {
      toCreate.passwordHash = await bcrypt.hash(toCreate.password, 10);
      delete toCreate.password;
    }
    const user = new User(toCreate);
    const result = await collection.insertOne(user.toMongo());
    return User.fromMongo({ ...user.toMongo(), _id: result.insertedId }).toJSON();
  }

  async update(id, userData) {
    const collection = await this.getCollection();
    const updateData = { ...userData, updatedAt: new Date() };
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return result.value ? User.fromMongo(result.value).toJSON() : null;
  }

  async delete(id) {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getCurrentUser(email) {
    return this.getByEmail(email);
  }
} 