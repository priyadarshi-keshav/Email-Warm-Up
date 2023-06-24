const { queue: moveMessageToLabel } = require('../queues/moveMessageToLabel.queue');
const { queue: createWarmupEmailQueue } = require('../queues/createWarmupQueue.queue');
const { queue: createWarmupReplyQueue } = require('../queues/createWarmupReplyQueue.queue');
const { queue: preCreateWarmupEmailQueue } = require('../queues/preCreateWarmupQueue.queue');
const { queue: sendWarmupEmailsQueue } = require('../queues/sendWarmupEmails.queue');
const { queue: replyWarmupEmailsQueue } = require('../queues/replyWarmupEmails.queue');

module.exports = {
    removeQueueJobs: async (req, res, next) => {
        try {
            const jobs = ["wait", "active", "completed", "failed", "paused", "delayed"]
            const { queueName, limit, jobType } = req.body;
            let response;

            if (jobs.includes(jobType)) {
                if (queueName === "moveMessageToLabel") {
                    // response = await moveMessageToLabel.clean(0, jobType, +limit);
                    response = await moveMessageToLabel.clean(0, +limit, jobType);
                }
                else if (queueName === "createWarmupEmailQueue") {
                    response = await createWarmupEmailQueue.clean(0, jobType, +limit)
                }
                else if (queueName === "createWarmupReplyQueue") {
                    response = await createWarmupReplyQueue.clean(0, jobType, +limit)
                }
                else if (queueName === "preCreateWarmupEmailQueue") {
                    response = await preCreateWarmupEmailQueue.clean(0, jobType, +limit)
                }
                else if (queueName === "sendWarmupEmailsQueue") {
                    response = await sendWarmupEmailsQueue.clean(0, jobType, +limit)
                }
                else if (queueName === "replyWarmupEmailsQueue") {
                    response = await replyWarmupEmailsQueue.clean(0, +limit, jobType)
                }
            }

            res.send({
                message: `${queueName} has been removed for job type ${jobType}.`,
                deletedCount: response.length
            });

        } catch (error) {
            next(error)
        }
    }
}