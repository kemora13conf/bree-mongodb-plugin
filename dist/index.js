"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MongoDBPersistence;
const database_1 = require("./config/database");
const jobRepository_1 = require("./jobRepository");
const utils_1 = require("./utils");
async function MongoDBPersistence(options, bree) {
    const dbConnection = await (0, database_1.createDatabaseConnection)(options);
    const jobRepository = new jobRepository_1.JobRepository(dbConnection);
    // --- Store original Bree methods ---
    const originalAdd = bree.prototype.add.bind(bree); // Important to bind to the correct context
    const originalRemove = bree.prototype.remove.bind(bree);
    const originalStart = bree.prototype.start.bind(bree);
    const originalStop = bree.prototype.stop.bind(bree);
    const originalRun = bree.prototype.run.bind(bree);
    // --- Override Bree methods ---
    bree.prototype.add = async (jobs) => {
        console.log('jobs', jobs);
        switch (typeof jobs) {
            case 'string':
                await jobRepository.createJob({ name: jobs });
                break;
            case 'object':
                const jobArray = Array.isArray(jobs) ? jobs : [jobs];
                for (const job of jobArray) {
                    if (typeof job === 'string') {
                        await jobRepository.createJob({ name: job });
                    }
                    else {
                        await jobRepository.createJob(job);
                    }
                }
                break;
            default:
                break;
        }
        return originalAdd(jobs); // Call original Bree method
    };
    bree.prototype.remove = async (name) => {
        if (name) {
            await jobRepository.deleteJob(name);
        }
        return originalRemove(name);
    };
    bree.prototype.start = async (name) => {
        console.log('name', name);
        if (name) {
            await jobRepository.updateJob(name, { status: 'running', lastRun: new Date() });
        }
        return originalStart(name);
    };
    bree.prototype.stop = async (name) => {
        if (name) {
            await jobRepository.updateJob(name, { status: 'stopped' }); //Update the status
        }
        return originalStop(name);
    };
    bree.prototype.run = async (name) => {
        if (name) {
            await jobRepository.updateJob(name, { status: 'running', lastRun: new Date() });
        }
        return originalRun(name);
    };
    // --- Load Jobs at Startup ---
    // const jobs = await jobRepository.getAllJobs();
    // for (const job of jobs) {
    //     try {
    //         const jobOptions: Bree.JobOptions = {
    //             name: job.name,
    //             path: job.path,
    //             timeout: job.timeout,
    //             worker: job.worker,
    //             date: job.date,
    //         };
    //         if (job.schedule) {
    //             jobOptions.interval = job.schedule;
    //         }
    //         // Use originalAdd to avoid infinite recursion and ensure correct initialization
    //         const existingJob = bree.prototype.config.jobs.find((j: any) => j.name === job.name);
    //         // If the job does not exist, add it
    //         if (!existingJob) {
    //             originalAdd(jobOptions);
    //         }
    //     } catch (err) {
    //         log(`Error initializing job ${job.name} from database:`, err);
    //     }
    // }
    (0, utils_1.log)('MongoDB persistence plugin loaded with method overrides');
}
