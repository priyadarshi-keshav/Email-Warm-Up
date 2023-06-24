const Bull = require('bull');
const { logger } = require("../logger");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");

const { sendWarmupEmailsJob } = require('../jobs/sendWarmupEmails.job');

const REDIS_PORT = process.env.REDIS_PORT || 6379
const REDIS_HOST_NAME = process.env.REDIS_HOST_NAME || "127.0.0.1"
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ""

const queueName = "sendWarmupEmailsQueue";

// Create a Bull queue instance
const queue = new Bull(queueName, {
    redis: {
        port: REDIS_PORT,
        host: REDIS_HOST_NAME,
        password: REDIS_PASSWORD
    }
});

// Start processing jobs in the queue
queue.process(sendWarmupEmailsJob);

// queue.on("completed", async (job, result) => {
//     logger.log("info", `${queueName}: Job ${job.id} completed <<<<=======`);
// })

queue.on("failed", async (job, err) => {
    logger.log("error", `${queueName}: Job ${job.id} is failed: ${err}`);
    //  job stalled more than allowable limit
});

setInterval(() => {
    queue.clean(0, "completed")
        .then((result) => {
            logger.log("info", `${result.length} completed jobs were removed from the queue.`);
        })
        .catch((err) => {
            logger.log("error", `Error cleaning completed jobs: ${err}`);
        });
}, 1 * 24 * 60 * 60 * 1000);

// Add a new job to the queue
const addJobToQueue = async (arguments) => {
    try {
        const job = await queue.add(arguments, {
            // removeOnComplete: true,
            // removeOnFail: true,
            // delay: 500,
            timeout: 40000,
            attempts: 4,
            
        });

        // logger.log('info', `${queueName}: Job ${job.id} for sender ${arguments?.senderProviderId?.userName} is added in queue.`);

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

module.exports = {
    queue,
    queueName,
    addJobToQueue
}