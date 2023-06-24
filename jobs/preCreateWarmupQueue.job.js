const { getSmtpProviders } = require("../controllers/smtp.controllers");
const { logger } = require("../logger");
const { addJobToQueue } = require("../queues/createWarmupQueue.queue");

const preCreateWarmupQueueJob = async (job) => {
    const { limit, userId, providerId, providerData, spamAlertActive } = job.data;

    // get the provider data array to send our warmup emails
    let smtpProviders = await getSmtpProviders(providerId, limit);

    logger.log("info", `Limit: ${limit}, Total Provider: ${smtpProviders.length}, userId: ${userId}, providerId: ${providerId}, TimeStamp: ${new Date()}`);

    // create the email body with sample smtpProviders and dump it into queue
    // let recipientEmailList = []

    for (let i = 0; i < smtpProviders.length; i++) {
        const receiverProviderData = smtpProviders[i];
        // recipientEmailList.push(receiverProviderData.userName);
        const senderProviderData = providerData[0]
        const arguments = {
            receiverProviderData, senderProviderData, userId
        }
        await addJobToQueue(arguments)
    };

    logger.log("info", `warmup queue is completed for provider ${providerId} of user ${userId}`)
};

module.exports = {
    preCreateWarmupQueueJob
};