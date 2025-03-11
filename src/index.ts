import Bree from 'bree';
import { MongoDBPluginOptions, JobDocument, BreeWithEvents } from './types';
import { createDatabaseConnection } from './database';
import { JobRepository } from './jobRepository';
import { log } from './utils';

export default async function MongoDBPersistence(
    bree: BreeWithEvents,
    options: MongoDBPluginOptions
) {
    const dbConnection = await createDatabaseConnection(options);
    const jobRepository = new JobRepository(dbConnection);


    //Load all jobs from database to bree
    const jobs = await jobRepository.getAllJobs();

    // Initialize jobs in Bree from the database
    for (const job of jobs) {
        try {
            const jobOptions: Bree.JobOptions = {
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

        } catch (err) {
            log(`Error initializing job ${job.name} from database:`, err);
        }
    }

    bree.on('job created', async (jobOptions: Bree.JobOptions) => {
        log(`Job created: ${jobOptions.name}`);
        try {
            await jobRepository.createJob(jobOptions);
        } catch (error) {
            log("Error creating job:", error);
        }

    });

    bree.on('job started', async (name: string) => {
        log(`Job started: ${name}`);
        try {
            await jobRepository.updateJob(name, { status: 'running', lastRun: new Date() });
        } catch (error) {
            log("Error starting job:", error)
        }
    });

    bree.on('job completed', async (name: string) => {
        log(`Job completed: ${name}`);
        await jobRepository.updateJob(name, { status: 'completed' });
    });

    bree.on('job failed', async (name: string, err: Error) => {
        log(`Job failed: ${name}`, err);
        await jobRepository.updateJob(name, { status: 'failed', error: err });
    });
    bree.on('job cancelled', async (name: string) => {
        log(`Job cancelled: ${name}`);
        await jobRepository.updateJob(name, { status: 'cancelled' });
    });
    bree.on('job deleted', async (name: string) => {
        log(`Job deleted: ${name}`);
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

    log('MongoDB persistence plugin loaded');
}