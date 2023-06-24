const { createEmailQueue } = require("../controllers/warmupEmailQueue.controller");
const { closeWarmupEmailRoom } = require("../controllers/warmupEmailRoom.controller");
const { decrementReplyExpected, incrementReplyExpected } = require("../controllers/warmupSettings.controller");
const { getUTCAddedTime } = require("../utils/helpers/moment.helper");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { Spintax } = require("../utils/helpers/spintex.helper");
const { handlebarCompiler } = require("../utils/helpers/handleBarCompiler.helper");


const createWarmupReplyQueueJob = async (job) => {
    // here the room is old and we update sender as receiver and viceversa / send the warm email from receiver to sender
    const {
        roomId,
        creatorId,
        senderProviderId,
        receiverProviderId,
        emailTemplateId,
        emailSubject,
        threadOrder,
        emailMessageId,
        // senderWarmupSetting
    } = job.data.room;

    // const { spamAlert } = job.data;

    try {
        // we need to check who is replying whether it is creator or receiver. 0S- 1R-2S-3R-4S
        // If creator is replying to receiver then we need to check receiver's replyExpected quota and
        // if receiver is replying to creator then we need to check creator's replyExpected quota

        // let warmupSettingData;
        // // here receiver is replying so we are checking the sender(who will be recipient) reply exp quota

        // if (creatorId === receiverProviderId.userId) {
        //     warmupSettingData = await getReplyExpected(senderProviderId.userId, senderProviderId._id);
        // } else {
        //     warmupSettingData = await getReplyExpected(receiverProviderId.userId, receiverProviderId._id);
        // }

        // if (warmupSettingData && warmupSettingData.replyExpected === 0) {
        //     return `Reply expected is 0 for provider ${warmupSettingData.providerId}`;
        // };

        // create the warmup email queue for reply
        const emailThreadData = emailTemplateId.emailThreads.filter(item => item.threadOrder === threadOrder + 1)[0];

        const lastThreadOrder = emailTemplateId.emailThreads.length - 1

        if (!emailThreadData) {
            // there is no such template available so we need to close the current room marked as threadEnd: true
            await closeWarmupEmailRoom(roomId);
            return `Room ${roomId} closed as there is no email thread left in the template.`;
        };

        let mailBody = Spintax(emailThreadData.mailBody);
        // here sender as receiver and viceversa / send the warm email from receiver to sender
        mailBody = handlebarCompiler(mailBody, {
            receiversFirstName: senderProviderId.senderName,
            sendersFirstName: receiverProviderId.senderName
        });

        // get the sendDate and sendTime passing 10 min from current time 
        // this room is picked as per the value of pickedQueueTime which is 10 min before than cooldown time
        // Hence, we pass 10 minutes only.
        const { date, time } = getUTCAddedTime(10);

        // create the email warmup queue 
        const emailQueueData = {
            userId: receiverProviderId.userId,
            parentId: "omni",
            emailTemplateId: emailTemplateId._id,
            threadId: emailThreadData._id,
            threadOrder: emailThreadData.threadOrder,
            isLastThreadOrder: lastThreadOrder === emailThreadData.threadOrder ? true : false,
            receiverProviderId: senderProviderId._id,
            mailSubject: emailSubject,
            mailBody,
            senderProviderId: receiverProviderId._id,
            sendCronTime: time,
            sendCronDate: date,
            isRepliedLog: true,
            repliedToMessageId: emailMessageId,
            roomId,
            label: process.env.LABEL_NAME,
            sendStatus: "PENDING"
        };

        // let's create queue and increment and decrement the warmUpSetting replyExpected field accordingly
        // we increment the replyExp for sender and decrement replyExpected for receiver
        await createEmailQueue(emailQueueData);

        // if (lastThreadOrder === emailThreadData.threadOrder) {
        //     await decrementReplyExpected(senderProviderId.userId, senderProviderId._id);
        // } else if (lastThreadOrder !== emailThreadData.threadOrder) {
        //     Promise.all([
        //         decrementReplyExpected(senderProviderId.userId, senderProviderId._id),
        //         incrementReplyExpected(receiverProviderId.userId, receiverProviderId._id, spamAlert)
        //     ])
        // }

        return `Room ${roomId} new reply queue is generated.`

    } catch (error) {
        await writeLoggerFile({
            logType: "Create warmup queue to reply => inside JOBS",
            error: error.message,
            roomData: {
                roomId,
                creatorId,
                emailTemplateId: emailTemplateId._id,
                threadOrder
            },
            timeStamp: new Date()
        });

        return {
            error: error.message,
            roomData: {
                roomId,
                creatorId,
                emailTemplateId: emailTemplateId._id,
                threadOrder
            },
        }
    }
}

module.exports = {
    createWarmupReplyQueueJob
}