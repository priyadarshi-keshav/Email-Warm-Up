const { Queue } = require("bullmq");
const { logger } = require("../logger");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { client: RedisClient } = require("../cache");
const { setUpWorker } = require("../workers");
const { moveMessageToLabelJob } = require("../jobs/moveMessageToLabel.job")

const REDIS_PORT = process.env.REDIS_PORT || 6379
const REDIS_HOST_NAME = process.env.REDIS_HOST_NAME || "127.0.0.1"
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ""

// in below SET variable we store all providers email to prevent duplicate job 
const uniqueProviderSet = "uniqueProviderSet";
const queueName = "moveMessageToLabel";

// Create a Bull queue instance
const queue = new Queue(queueName, {
    connection: {
        port: REDIS_PORT,
        host: REDIS_HOST_NAME,
        password: REDIS_PASSWORD
    }
});

// Add a new job to the queue for each email provider
const addJobToQueue = async (jobList) => {
    try {
        let uniqueJobsList = [];
        // remove list which already exist in Redis queue
        for (let job of jobList) {
            const providerExist = await RedisClient.sIsMember(uniqueProviderSet, job.data.imap.user);

            if (!providerExist) {
                await RedisClient.sAdd(uniqueProviderSet, job.data.imap.user);
                uniqueJobsList.push(job);
            } else {
                logger.log("warn", `Job already exists for provider: ${job.data.imap.user}`);
            };
        };

        await queue.addBulk(uniqueJobsList)

        // const job = await queue.add(
        //     queueName,
        //     data,
        //     {
        //         removeOnComplete: {
        //             age: 24 * 3600
        //         },
        //         removeOnFail: {
        //             age: 24 * 3600
        //         },
        //         // delay: 500,
        //         // timestamp: new Date(),
        //         attempts: 4
        //     }
        // );

        // logger.log('info', `${queueName}: Job ${job.id} and user ${data?.imap?.user} added to the queue----------------------------.`);

        return;

    } catch (error) {
        writeLoggerFile({
            error: error.message,
            log: `${queueName}: inside queue`
        })
    }
};

// execute worker
setUpWorker(queueName, moveMessageToLabelJob, 25);

module.exports = {
    queue,
    queueName,
    addJobToQueue
}