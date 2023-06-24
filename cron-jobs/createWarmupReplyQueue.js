const { getWarmupEmailRooms, updatePickedForTheDayValue } = require("../controllers/warmupEmailRoom.controller");
const { addJobToQueue } = require("../queues/createWarmupReplyQueue.queue");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");

const CreateWarmupReplyQueue = async ({ spamAlert }) => {
    try {
        // get all the receivers from warmup email room
        const warmupEmailRooms = await getWarmupEmailRooms(spamAlert);

        // bulk update pickedForTheDay: true field in warmupEmailRoom 
        const response = await updatePickedForTheDayValue(warmupEmailRooms.map(item => item.roomId));

        for (let room of warmupEmailRooms) {
            const argData = { room, spamAlert }
            await addJobToQueue(argData);
        }

        // await writeLoggerFile({
        //     logType: "New reply queue has been added using cron CreateWarmupReplyQueue.",
        //     response,
        //     timeStamps: new Date()
        // });

        return;

    } catch (error) {
        await writeLoggerFile({
            logType: "Create warmup queue to reply.",
            error: error.message,
            timeStamp: new Date()
        });

        return;
    }
}

module.exports = {
    CreateWarmupReplyQueue
};
