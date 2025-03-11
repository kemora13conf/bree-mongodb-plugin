import { MongoDBPluginOptions } from './types';

const DEFAULT_COLLECTION_NAME = 'bree_jobs';

export function validateAndNormalizeConfig(
    options: MongoDBPluginOptions
): MongoDBPluginOptions {

    if (!options.mongoose && !options.mongoClient && !options.uri && !options.connection && !options.db) {
        throw new Error(
            'You must provide either a Mongoose instance, a MongoClient instance, a MongoDB connection URI, a Mongoose connection, or a MongoDB Db instance.'
        );
    }

    const normalizedOptions: MongoDBPluginOptions = {
        mongoose: options.mongoose ? options.mongoose : undefined,
        connection: options.connection ? options.connection : undefined,
        mongoClient: options.mongoClient ? options.mongoClient : undefined,
        db: options.db ? options.db : undefined,
        uri: options.uri ? options.uri : undefined,
        dbName: options.dbName ? options.dbName : 'bree',  // Default database name
        collectionName: options.collectionName ? options.collectionName : DEFAULT_COLLECTION_NAME,
        loggerOptions: options.loggerOptions ? options.loggerOptions : false, // Or provide a default Pino config
    };
    return normalizedOptions;
}