// get all the enabled user list then wrt users email/ID we will find warmupEmailQueue which meets the condition of sendCronTime <= current time 
// once we send the mail we will create one room and dump it into warmupRoomSettings to get reply from receiver

const {
    getWarmupEmailQueues,
    updateManyQueueStatus,
    deleteWarmupEmailQueuesByID
} = require("../controllers/warmupEmailQueue.controller");
const { deleteManyWarmupEmailRoom } = require("../controllers/warmupEmailRoom.controller");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { logger } = require("../logger");
const { addJobToQueue, queueName } = require("../queues/replyWarmupEmails.queue");

const ReplyWarmupEmails = async () => {
    let warmupQueueIds;
    try {
        const warmupEmailQueueDataList = await getWarmupEmailQueues({ isRepliedLog: true });
        if (warmupEmailQueueDataList.length === 0) return;

        warmupQueueIds = warmupEmailQueueDataList.map(item => item._id);
        // here we need to update the sendStatus to SENDING for all queue which we picked
        await updateManyQueueStatus(warmupQueueIds, "SENDING")

        // warmupQueueIds = warmupEmailQueueDataList.map(queue => queue._id);
        let queueIDList = []
        let roomIDList = []
        let jobList = []

        for (let queue of warmupEmailQueueDataList) {
            const {
                _id,
                userId,
                senderProviderId,
                receiverProviderId,
                roomId,
            } = queue;

            if (
                !senderProviderId ||
                !receiverProviderId ||
                !userId ||
                senderProviderId?.isWarmupActive != true ||
                receiverProviderId?.isWarmupActive != true
            ) {
                queueIDList.push(_id)
                roomIDList.push(roomId)
                continue;
            };

            jobList.push({
                name: queueName,
                data: queue,
                opts: {
                    removeOnComplete: {
                        age: 48 * 3600
                    },
                    removeOnFail: {
                        age: 48 * 3600
                    }
                }
            });
            // await addJobToQueue(queue);
        };

        await addJobToQueue(jobList);

        Promise.all([
            // delete the email queues
            deleteWarmupEmailQueuesByID(queueIDList),
            deleteManyWarmupEmailRoom(roomIDList)
        ])

        return;

    } catch (error) {
        Promise.all([
            updateManyQueueStatus(warmupQueueIds, "PENDING"),
            writeLoggerFile({
                status: error.status,
                logType: "Send warmup emails cron.",
                error: error.message,
                timeStamps: new Date()
            })
        ])
            .then(results => logger.log('info', `Inside catch promise resolved: ${results}`))
            .catch(error => logger.log('error', `Inside catch promise rejected: ${error.message}`))

        return;
    }
}

module.exports = {
    ReplyWarmupEmails
};