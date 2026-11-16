import { MongoClient } from 'mongodb';

const uri = process.env.DATABASE_URI || process.env.MONGODB_URI;
let client: MongoClient | null = null;

export async function getMongoClient() {
  if (!uri) {
    throw new Error('DATABASE_URI or MONGODB_URI environment variable is required');
  }
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export async function closeMongoClient() {
  if (client) {
    await client.close();
    client = null;
  }
}