
# bree-mongodb-plugin

[![npm version](https://badge.fury.io/js/bree-mongodb-plugin.svg)](https://badge.fury.io/js/bree-mongodb-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/bree-mongodb-plugin/ci.yml?branch=main)](https://github.com/YOUR_USERNAME/bree-mongodb-plugin/actions) <!-- Replace with your CI badge -->
[![Coverage Status](https://coveralls.io/repos/github/YOUR_USERNAME/bree-mongodb-plugin/badge.svg?branch=main)](https://coveralls.io/github/YOUR_USERNAME/bree-mongodb-plugin?branch=main) <!-- Replace with your coverage badge -->

A robust, performant, and scalable MongoDB persistence plugin for [Bree.js](https://github.com/breejs/bree).  Provides a seamless way to store job state and data in MongoDB, supporting both the native MongoDB driver and Mongoose.  Fully typed with TypeScript.

## Features

*   **Flexible Connection Options:**
    *   Use a direct MongoDB connection URI.
    *   Provide a pre-configured `MongoClient` instance.
    *   Provide a pre-configured `Db` instance.
    *   Use an existing Mongoose instance.
    *   Use an existing `mongoose.Connection` instance.
*   **Performance & Scalability:**
    *   Leverages MongoDB's efficient querying and indexing.
    *   Designed for sharded MongoDB deployments.
    *   Minimizes database round-trips.
*   **Full TypeScript Support:**  Enjoy compile-time type safety and improved development experience.
*   **Customizable:**
    *   Configure the database name, collection name, and other connection options.
    *   Optionally configure logging.
*   **Robust Error Handling:**  Custom error classes for detailed error information.
*   **Well-Tested:** Includes comprehensive unit tests for reliability.
*   **Bree Integration:** Seamlessly hooks into Bree's lifecycle events.
*   **Data Persistence:** Stores job name, status, schedule, last run time, error details, and (optionally) job output.

## Installation

```bash
npm install bree-mongodb-plugin mongodb mongoose  # Install peer dependencies
```

## Usage

### Basic Example (with MongoDB URI)

```typescript
import Bree from 'bree';
import MongoDBPersistence from 'bree-mongodb-plugin';
import { MongoClient } from 'mongodb';

async function main() {
  const mongoClient = new MongoClient('mongodb://localhost:27017'); // Replace with your URI
  await mongoClient.connect();

  const bree = new Bree({
    logger: false, // Use your preferred logger (e.g., Pino, Winston)
    jobs: [],
    errorHandler(error, workerMetadata) {
      // Handle errors within your job workers
      console.error('Worker error:', error, workerMetadata);
    },
    plugins: [
      async (bree) =>
        await MongoDBPersistence(bree, {
            mongoClient // Or: uri: 'mongodb://localhost:27017', dbName: 'my-bree-db'
        }),
    ],
  });

  bree.add([
    {
      name: 'my-job',
      interval: 'every 5 seconds',
      path: './path/to/my-job.js', // Your job file
    },
  ]);

  await bree.start();

    // --- Graceful Shutdown ---
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, gracefully shutting down...');
        await bree.stop();
        await mongoClient.close(); // Close MongoDB connection
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('Received SIGINT, gracefully shutting down...');
        await bree.stop();
        await mongoClient.close(); // Close MongoDB connection
        process.exit(0);
    });
}

main().catch(console.error);
```

### Example with Mongoose

```typescript
import Bree from 'bree';
import MongoDBPersistence from 'bree-mongodb-plugin';
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/my-bree-db'); // Replace with your URI

  const bree = new Bree({
    logger: false,
    jobs: [],
    errorHandler(error, workerMetadata) {
      console.error('Worker error:', error, workerMetadata);
    },
    plugins: [
      async (bree) =>
        await MongoDBPersistence(bree, {
          mongoose, // Pass your Mongoose instance
          //  connection: mongoose.connection,  // Or pass the connection explicitly
          collectionName: 'my_custom_jobs_collection', // Optional: custom collection name
        }),
    ],
  });

  // ... (rest of your Bree setup)
     // --- Graceful Shutdown ---
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, gracefully shutting down...');
        await bree.stop();
        //await mongoose.disconnect(); //No need to close the connection let the app handle
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('Received SIGINT, gracefully shutting down...');
        await bree.stop();
        //await mongoose.disconnect(); //No need to close the connection let the app handle
        process.exit(0);
    });
}

main().catch(console.error);
```

### Example with already connected MongoDB client and Db instance

```typescript
import Bree from 'bree';
import MongoDBPersistence from 'bree-mongodb-plugin';
import { MongoClient } from 'mongodb';


async function main() {
    const mongoClient = new MongoClient('mongodb://localhost:27017');
    await mongoClient.connect();
    const db = mongoClient.db('my-bree-db');


  const bree = new Bree({
    logger: false,
    jobs: [],
    errorHandler(error, workerMetadata) {
      console.error('Worker error:', error, workerMetadata);
    },
    plugins: [
      async (bree) =>
        await MongoDBPersistence(bree, {
          mongoClient,  // Pass the already connected MongoClient
          db,        // Pass the Db instance
        }),
    ],
  });
    // ... (rest of your Bree setup)

    // --- Graceful Shutdown ---
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, gracefully shutting down...');
        await bree.stop();
        await mongoClient.close();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('Received SIGINT, gracefully shutting down...');
        await bree.stop();
        await mongoClient.close();
        process.exit(0);
    });
}

main().catch(console.error);

```

## Configuration Options

The `MongoDBPersistence` plugin accepts an options object with the following properties:

| Option           | Type                                 | Description                                                                                                                          | Default              |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| `mongoose`       | `Mongoose`                           | An optional pre-configured Mongoose instance.                                                                                       | `null`               |
| `connection`     | `mongoose.Connection`              | An optional pre-configured mongoose connection instance.                                                                         | `null`               |
| `mongoClient`     | `MongoClient`                          |  An optional pre-configured `MongoClient` instance.                                                                     | `null`          |
| `db`     | `Db`                          | An optional pre-configured `Db` instance.                                                                     | `null`          |
| `uri`            | `string`                             | The MongoDB connection URI. Required if `mongoClient`, `mongoose`,`db` and `connection` is not provided.                                       | `''`                 |
| `dbName`         | `string`                             | The name of the MongoDB database to use.                                                                                            | `'bree'`             |
| `collectionName` | `string`                             | The name of the MongoDB collection to store job data in.                                                                               | `'bree_jobs'`        |
| `loggerOptions` | `LoggerOptions` \| `boolean` | Options for the Pino logger.  Set to `true` for default Pino logging, or `false` to disable. See [Pino documentation](https://getpino.io/). | `false`              |

**Important:** You must provide *either* a `mongoose` instance, a `mongoClient` instance, a `uri` string, a `connection` instance or a `db` instance.

## Data Model

The plugin stores job information in a MongoDB document with the following structure:

```typescript
interface JobDocument {
  _id: string;  // Job name (Bree's unique identifier)
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending' | 'scheduled' | string;
  schedule?: string; //cron, date or human readable schedule
  lastRun?: Date;
  error?: any; // Store error details
  output?: any; // *Optionally* store job output (consider size limitations)
  path?: string;
  timeout?: number | string | false | undefined;
  worker?: any;
  date?: Date;
}
```

**Note on `output`:**  Storing large job outputs directly in the database might not be optimal.  Consider using GridFS or storing a reference to external storage (e.g., AWS S3) for large outputs.

## Graceful Shutdown

It's crucial to handle graceful shutdowns to prevent data loss or corruption. The plugin itself *does not* close the connection to MongoDB.  Your application *must* handle this.  The examples above demonstrate how to listen for `SIGTERM` and `SIGINT` signals and properly close the MongoDB connection before exiting.  Make sure you adapt this to your specific deployment environment (e.g., using a process manager like PM2).

## Error Handling

The plugin uses custom error classes to provide specific error information:

*   `DatabaseConnectionError`:  Thrown if there's an issue connecting to the database.
*   `JobNotFoundError`: Thrown if a requested job is not found in the database.

You can catch these errors and handle them appropriately in your application.

## Logging

The plugin supports configurable logging using [Pino](https://getpino.io/). You can pass `loggerOptions` to customize the logging behavior.  If you don't need logging, set `loggerOptions` to `false`. For basic development, consider setting it to true to use the default Pino logger.

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines. (You'll need to create this file).

## License

MIT License.  See [LICENSE](LICENSE) for details. (You'll need to create this file).
