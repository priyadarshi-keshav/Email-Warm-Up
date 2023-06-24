const Arena = require('bull-arena');
const Bull = require('bull');
const { queueName: moveMessageToLabel } = require('./moveMessageToLabel.queue');
const { queueName: createWarmupEmailQueue } = require('./createWarmupQueue.queue');
const { queueName: createWarmupReplyQueue } = require('./createWarmupReplyQueue.queue');
const { queueName: preCreateWarmupEmailQueue } = require('./preCreateWarmupQueue.queue');
const { queueName: sendWarmupEmailsQueue } = require('./sendWarmupEmails.queue');
const { queueName: replyWarmupEmailsQueue } = require('./replyWarmupEmails.queue');

const REDIS_PORT = process.env.REDIS_PORT || 6379
const REDIS_HOST_NAME = process.env.REDIS_HOST_NAME || "127.0.0.1"
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ""

const arenaConfig = Arena({
    Bull: Bull,
    queues: [
        {
            name: moveMessageToLabel,
            hostId: "Move_Message_To_Label",
            redis: {
                port: REDIS_PORT,
                host: REDIS_HOST_NAME,
                password: REDIS_PASSWORD
            }
        },
        {
            name: preCreateWarmupEmailQueue,
            hostId: "Pre_Warmup_Fresh_Queue",
            redis: {
                port: REDIS_PORT,
                host: REDIS_HOST_NAME,
                password: REDIS_PASSWORD
            }
        },
        {
            name: createWarmupEmailQueue,
            hostId: "Warmup_Fresh_Queue",
            redis: {
                port: REDIS_PORT,
                host: REDIS_HOST_NAME,
                password: REDIS_PASSWORD
            }
        },
        {
            name: createWarmupReplyQueue,
            hostId: "Warmup_Reply_Queue",
            redis: {
                port: REDIS_PORT,
                host: REDIS_HOST_NAME,
                password: REDIS_PASSWORD
            }
        },
        {
            name: sendWarmupEmailsQueue,
            hostId: "Send_Warmup_Emails",
            redis: {
                port: REDIS_PORT,
                host: REDIS_HOST_NAME,
                password: REDIS_PASSWORD
            }
        },
        {
            name: replyWarmupEmailsQueue,
            hostId: "Reply_Warmup_Emails",
            redis: {
                port: REDIS_PORT,
                host: REDIS_HOST_NAME,
                password: REDIS_PASSWORD
            }
        },
    ]
});

module.exports = {
    arenaConfig
}