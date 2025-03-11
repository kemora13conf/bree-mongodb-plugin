import Bree from 'bree';
import { MongoClient } from 'mongodb';
import MongoDBPersistence from '../src/index'; // Update path if needed
import { MongoMemoryServer } from 'mongodb-memory-server'; //For mocking mongo db
import { JobRepository } from '../src/jobRepository';
import { createDatabaseConnection } from '../src/database';


describe('MongoDBPersistence Plugin', () => {
    let bree: Bree;
    let mongod: MongoMemoryServer;
    let mongoClient: MongoClient;

    beforeAll(async () => {
        // Start an in-memory MongoDB server for testing
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        mongoClient = new MongoClient(uri);
        await mongoClient.connect();

        bree = new Bree({
            logger: false,
            jobs: [],
        });
    });

    afterAll(async () => {
        await mongoClient.close();
        await mongod.stop();
    });
    beforeEach(async () => {
        const db = mongoClient.db('bree-test'); // Use a test database
        const collections = await db.collections();
        for (const collection of collections) {
            // Drop the collection if it exists
            if (collection.collectionName === 'bree_jobs') {
                await collection.drop();
            }
        }
        bree.config.jobs = [];
    })

    it('should load and initialize', async () => {
        await MongoDBPersistence(bree, { mongoClient });
        expect(bree).toBeDefined();
    });

    it('should create and persist a job', () => {
        return new Promise<void>(async (resolve) => {
            await MongoDBPersistence(bree, { mongoClient });

            bree.add({
                name: 'test-job',
                interval: '1s',
                path: () => console.log("test job executed"),
            });

            bree.on('job created', async (jobOptions) => {
                expect(jobOptions.name).toBe('test-job');
                const dbConnection = await createDatabaseConnection({ mongoClient });
                const jobRepository = new JobRepository(dbConnection);

                const job = await jobRepository.getJob('test-job');

                expect(job).toBeDefined();
                expect(job!.name).toBe('test-job');
                expect(job!.status).toBe('pending');
                resolve();
            });
        });
    });
    it('should start and update job status', () => {
        return new Promise<void>(async (done) => {
            await MongoDBPersistence(bree, { mongoClient });
            bree.add({
                name: 'start-test-job',
                interval: 'at 1:00 am',
                path: () => { console.log("test job executed") },
            });
            bree.on('job started', async (name) => {
                expect(name).toBe('start-test-job');
                const dbConnection = await createDatabaseConnection({ mongoClient });
                const jobRepository = new JobRepository(dbConnection);
                const job = await jobRepository.getJob('start-test-job');
                expect(job).toBeDefined();
                expect(job!.status).toBe('running');
                expect(job!.lastRun).toBeInstanceOf(Date);
                done(); // Signal test completion
            });
            bree.start('start-test-job');
        })
    });

    it('should complete and update job status', () => {
        return new Promise<void>(async (done) => {
            await MongoDBPersistence(bree, { mongoClient });
            bree.add({
                name: 'complete-test-job',
                timeout: 100,
                path: () => { console.log("complete test job executed") },
            });
            bree.on('job completed', async (name) => {
                expect(name).toBe('complete-test-job');
                const dbConnection = await createDatabaseConnection({ mongoClient });
                const jobRepository = new JobRepository(dbConnection);
                const job = await jobRepository.getJob('complete-test-job');
                expect(job).toBeDefined();
                expect(job!.status).toBe('completed');
                done(); // Signal test completion
            });
            bree.run('complete-test-job');
        })
    });

    it('should delete a job', async () => {
        await MongoDBPersistence(bree, { mongoClient });
        const dbConnection = await createDatabaseConnection({ mongoClient });
        const jobRepository = new JobRepository(dbConnection);

        bree.add({
            name: 'delete-test-job',
            interval: '1s',
            path: () => console.log("delete test job executed"),
        });
        bree.remove('delete-test-job');
        const deletedJob = await jobRepository.getJob('delete-test-job');
        expect(deletedJob).toBeNull();
    });
    // Add more tests for other events (job failed, etc.) and edge cases.
});