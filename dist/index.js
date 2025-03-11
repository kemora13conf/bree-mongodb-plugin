"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MongoDBPersistence;
const database_1 = require("./database");
const jobRepository_1 = require("./jobRepository");
const utils_1 = require("./utils");
async function MongoDBPersistence(bree, options) {
    const dbConnection = await (0, database_1.createDatabaseConnection)(options);
    const jobRepository = new jobRepository_1.JobRepository(dbConnection);
    //Load all jobs from database to bree
    const jobs = await jobRepository.getAllJobs();
    // Initialize jobs in Bree from the database
    for (const job of jobs) {
        try {
            const jobOptions = {
                name: job.name,
                path: job.path,
                timeout: job.timeout,
                worker: job.worker,
                date: job.date,
            };
            // Check if schedule is defined before assigning
            if (job.schedule) {
                jobOptions.interval = job.schedule;
            }
            // Check if the job already exists in Bree
            const existingJob = bree.config.jobs.find(j => j.name === job.name);
            // If the job does not exist, add it
            if (!existingJob) {
                bree.add(jobOptions);
            }
        }
        catch (err) {
            (0, utils_1.log)(`Error initializing job ${job.name} from database:`, err);
        }
    }
    bree.on('job created', async (jobOptions) => {
        (0, utils_1.log)(`Job created: ${jobOptions.name}`);
        try {
            await jobRepository.createJob(jobOptions);
        }
        catch (error) {
            (0, utils_1.log)("Error creating job:", error);
        }
    });
    bree.on('job started', async (name) => {
        (0, utils_1.log)(`Job started: ${name}`);
        try {
            await jobRepository.updateJob(name, { status: 'running', lastRun: new Date() });
        }
        catch (error) {
            (0, utils_1.log)("Error starting job:", error);
        }
    });
    bree.on('job completed', async (name) => {
        (0, utils_1.log)(`Job completed: ${name}`);
        await jobRepository.updateJob(name, { status: 'completed' });
    });
    bree.on('job failed', async (name, err) => {
        (0, utils_1.log)(`Job failed: ${name}`, err);
        await jobRepository.updateJob(name, { status: 'failed', error: err });
    });
    bree.on('job cancelled', async (name) => {
        (0, utils_1.log)(`Job cancelled: ${name}`);
        await jobRepository.updateJob(name, { status: 'cancelled' });
    });
    bree.on('job deleted', async (name) => {
        (0, utils_1.log)(`Job deleted: ${name}`);
        await jobRepository.deleteJob(name);
    });
    // Graceful shutdown:  Ensure database connection is closed.
    // Bree doesn't have a built-in shutdown event, so you'll need to handle
    // this in your application's main shutdown logic.  For example:
    // process.on('SIGTERM', async () => {
    //   await dbConnection.disconnect();
    //   process.exit(0);
    // });
    // process.on('SIGINT', async () => {
    //   await dbConnection.disconnect();
    //   process.exit(0);
    // });
    // YOU MUST HANDLE THE DISCONNECTION ON YOUR APP LEVEL
    (0, utils_1.log)('MongoDB persistence plugin loaded');
}
