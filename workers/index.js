const { Worker } = require("bullmq");
const { logger } = require("../logger");

const REDIS_PORT = process.env.REDIS_PORT || 6379
const REDIS_HOST_NAME = process.env.REDIS_HOST_NAME || "127.0.0.1"
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ""
const { client: RedisClient } = require("../cache");

// setup the worker to process jobs
const setUpWorker = (queueName, jobProcess, concurrency) => {
    const worker = new Worker(queueName, jobProcess, {
        connection: {
            host: REDIS_HOST_NAME,
            port: REDIS_PORT,
            password: REDIS_PASSWORD
        },
        concurrency,
        autorun: true
    });

    const uniqueProviderSet = "uniqueProviderSet";

    worker.on("completed", async (job, result) => {
        if (queueName === "moveMessageToLabel") {
            // remove provider email from redis
            await RedisClient.sRem(uniqueProviderSet, job.data?.imap?.user)
        };
        
        // logger.log("info", `${queueName}: Job ${job.id} completed <<<<=======`);
    })

    worker.on("failed", async (job, err) => {
        if (queueName === "moveMessageToLabel") {
            // remove provider email from redis
            await RedisClient.sRem(uniqueProviderSet, job.data?.imap?.user)
        };
        
        logger.log("error", `${queueName}: Job ${job.id} is failed: ${err}`);
    });
}

module.exports = {
    setUpWorker
}