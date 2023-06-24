const { getWarmupSettings, pickedWarmupSettings } = require("../controllers/warmupSettings.controller");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { logger } = require("../logger");
const { addJobToQueue } = require("../queues/preCreateWarmupQueue.queue");


const CreateWarmupQueue = async () => {
    try {
        // here we get the warmup settings as per pickedForTheDay
        const usersWarmUpSettings = await getWarmupSettings();

        // here we update the lastPickedDay = new Date() in user warm settings.
        await pickedWarmupSettings(
            usersWarmUpSettings.map(item => item._id)
        );

        // here we are iterating over warmupSettings array having all enabled users and pickedForTheDay: false
        for (let user of usersWarmUpSettings) {
            //need to check the day and the limit and get the unique smtpProviders on count >= limit
            const { providerData } = user;

            // here providerData contains all SMTP data to create warmup emails queue for current user
            if (providerData?.length === 0) continue;
            await addJobToQueue(user)
        }

        // logger.log("info", JSON.stringify({
        //     logType: "create warmup email queue is added to PREJob for user setting.",
        //     response,
        //     timeStamps: new Date()
        // }))

        // await writeLoggerFile({
        //     logType: "create warmup email queue is added to PREJob for user setting.",
        //     response,
        //     timeStamps: new Date()
        // })

        return;

    } catch (error) {
        await writeLoggerFile({
            logType: "Create warmup queue to send.",
            error: error.message,
            timeStamp: new Date()
        });

        return;
    }
}

module.exports = {
    CreateWarmupQueue
};