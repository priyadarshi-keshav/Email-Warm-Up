const { Queue } = require("bullmq");
const { logger } = require("../logger");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");

const { sendWarmupEmailsJob } = require('../jobs/sendWarmupEmails.job');
const { setUpWorker } = require("../workers");

const REDIS_PORT = process.env.REDIS_PORT || 6379
const REDIS_HOST_NAME = process.env.REDIS_HOST_NAME || "127.0.0.1"
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ""

const queueName = "replyWarmupEmailsQueue";

// Create a Bull queue instance
const queue = new Queue(queueName, {
    connection: {
        port: REDIS_PORT,
        host: REDIS_HOST_NAME,
        password: REDIS_PASSWORD
    }
});

// Add a new job to the queue
const addJobToQueue = async (jobList) => {
    try {

        await queue.addBulk(jobList);

        // const job = await queue.add(
        //     queueName,
        //     data,
        //     {
        //         removeOnComplete: {
        //             age: 2 * 3600
        //         },
        //         removeOnFail: {
        //             age: 24 * 3600
        //         },
        //         attempts: 4
        //     }
        // );

        // logger.log('info', `${queueName}: Job ${job.id} for sender ${data?.senderProviderId?.userName} is added in queue.`);

        return;

    } catch (error) {
        logger.log("error", JSON.stringify({
            error: error.message,
            log: `${queueName}: inside queue`
        }))

        await writeLoggerFile({
            error: error.message,
            log: `${queueName}: inside queue`
        })
    }
};

setUpWorker(queueName, sendWarmupEmailsJob, 50);

module.exports = {
    queue,
    queueName,
    addJobToQueue
}