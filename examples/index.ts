import Bree from "bree";
import MongoDBPersistence from "../dist/index.js";
import mongoose from "mongoose";
import { BreeWithEvents } from "../dist/types.js";

async function main() {
  const conn = await mongoose.connect("mongodb://localhost:27017", {
    dbName: "my-bree-db",
  });

  if (conn.connection.readyState === 1) {
    console.info(`Connected to database successfully.`);

    conn.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
    });

    conn.connection.once("open", () => {
      console.info("=> DB STATE: Database connection opened");
    });
  } else {
    throw new Error("Failed to establish database connection");
  }

  const _bree = await Bree.extend(MongoDBPersistence, {
    mongoose, // Pass your Mongoose instance
    // connection: mongoose.connection, // Or pass the connection explicitly
    collectionName: "my_custom_jobs_collection", // Optional: custom collection name
  });


  // let _bree = await Bree.extend(async (opts, bree:any)=>{
  //   const originalAdd = bree.prototype.add.bind(bree);
  // }, {
  //   mongoose, // Pass your Mongoose instance
  //   // connection: mongoose.connection, // Or pass the connection explicitly
  //   collectionName: "my_custom_jobs_collection", // Optional: custom collection name
  // });

  console.log("Bree", { _bree });

  const bree = new Bree({
    logger: false,
    jobs: [],
    errorHandler(error, workerMetadata) {
      console.error("Worker error:", error, workerMetadata);
    },
  });

  bree.add([
    {
      name: "my-job",
      interval: "every 5 seconds",
      path: "./jobs/job.js", // Your job file
    },
  ]);
  bree.start();

  // ... (rest of your Bree setup)
  // --- Graceful Shutdown ---
  // process.on("SIGTERM", async () => {
  //     console.log("Received SIGTERM, gracefully shutting down...");
  //     await bree.stop();
  //     // await mongoose.disconnect(); // No need to close the connection let the app handle
  //     process.exit(0);
  // });

  // process.on("SIGINT", async () => {
  //     console.log("Received SIGINT, gracefully shutting down...");
  //     await bree.stop();
  //     // await mongoose.disconnect(); // No need to close the connection let the app handle
  //     process.exit(0);
  // });
}

main().catch(console.error);
