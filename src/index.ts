import Bree from 'bree';
import { MongoDBPluginOptions } from './types';
import { createDatabaseConnection } from './config/database';
import { JobRepository } from './jobRepository';
import { log } from './utils';


export default async function MongoDBPersistence(
    options: MongoDBPluginOptions,
    bree: typeof Bree,
) {
    const dbConnection = await createDatabaseConnection(options);
    const jobRepository = new JobRepository(dbConnection);

    // --- Store original Bree methods ---
    const originalAdd = bree.prototype.add.bind(bree); // Important to bind to the correct context
    const originalRemove = bree.prototype.remove.bind(bree);
    const originalStart = bree.prototype.start.bind(bree);
    const originalStop = bree.prototype.stop.bind(bree);
    const originalRun = bree.prototype.run.bind(bree);

    // --- Override Bree methods ---
    bree.prototype.add = async (jobs: | string
        | (() => void)
        | Bree.JobOptions
        | Array<string | (() => void) | Bree.JobOptions>) => {
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
                    } else {
                        await jobRepository.createJob(job);
                    }
                }
                break;
            default:
                break;
        }
        return originalAdd(jobs); // Call original Bree method
    };

    bree.prototype.remove = async (name?: string) => {
        if (name) {
            await jobRepository.deleteJob(name);
        }
        return originalRemove(name);
    };

    bree.prototype.start = async (name?: string) => {
        console.log('name', name);
        if (name) {
            await jobRepository.updateJob(name, { status: 'running', lastRun: new Date() });
        }
        return originalStart(name);
    };

    bree.prototype.stop = async (name?: string) => {
        if (name) {
            await jobRepository.updateJob(name, { status: 'stopped' }); //Update the status
        }
        return originalStop(name);
    };

    bree.prototype.run = async (name?: string) => {
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

    log('MongoDB persistence plugin loaded with method overrides');
}