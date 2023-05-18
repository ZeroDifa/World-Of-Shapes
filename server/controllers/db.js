const { MongoClient } = require('mongodb');

class DataBase {
    constructor(uri, options = {}) {
        if (DataBase.instance) {
            return DataBase.instance;
        }
        this.uri = uri;
        this.options = options;
        this.client = null;
        this.db = null;
        DataBase.instance = this;
    }

    async connect() {
        try {
            this.client = await MongoClient.connect(this.uri, this.options);
            console.log('Connected to MongoDB!');
            this.db = this.client.db();
        } catch (err) {
            console.log('Error connecting to MongoDB', err);
        }
    }

    async close() {
        try {
            await this.client.close();
            console.log('Disconnected from MongoDB!');
        } catch (err) {
            console.log('Error disconnecting from MongoDB', err);
        }
    }

    async find(collectionName, query = {}, options = {}) {
        try {
            const collection = this.db.collection(collectionName);
            const results = await collection.find(query, options).toArray();
            return results;
        } catch (err) {
            console.log(`Error finding documents in ${collectionName}`, err);
        }
    }

    async insert(collectionName, document) {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.insertOne(document);
            return result;
        } catch (err) {
            console.log(`Error inserting documents into ${collectionName}`, err);
        }
    }

    async update(collectionName, query, update) {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.updateMany(query, update);
            console.log(`Updated ${result.modifiedCount} documents in ${collectionName}`);
        } catch (err) {
            console.log(`Error updating documents in ${collectionName}`, err);
        }
    }

    async delete(collectionName, query) {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.deleteMany(query);
            console.log(`Deleted ${result.deletedCount} documents from ${collectionName}`);
        } catch (err) {
            console.log(`Error deleting documents from ${collectionName}`, err);
        }
    }
}

module.exports = DataBase;
