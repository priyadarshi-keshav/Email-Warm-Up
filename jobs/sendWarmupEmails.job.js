// get all the enabled user list then wrt users email/ID we will find warmupEmailQueue which meets the condition of sendCronTime <= current time 
// once we send the mail we will create one room and dump it into warmupRoomSettings to get reply from receiver

const {
    updateWarmupEmailQueueStatus,
    deleteWarmupEmailQueue,
    deleteWarmupEmailQueuesByProviderID,
} = require("../controllers/warmupEmailQueue.controller");
const sendEmailViaSMTP = require("../providers/SMTP.provider");
const { v4: uuidv4 } = require("uuid");
const { createWarmupEmailLogs, updateReplyEventInWarmupEmailLogs } = require("../controllers/warmupEmailLogs.controller");
const { createWarmupEmailRoom, updateWarmupEmailRoom, deleteWarmupEmailRoom } = require("../controllers/warmupEmailRoom.controller");
const { getMinutes, getUTCAddedTime } = require("../utils/helpers/moment.helper");
const { decrypted } = require("../utils/helpers/crypter.helper");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { disconnectSMTPprovider } = require("../controllers/smtp.controllers");
const { logger } = require("../logger");
// const { addJobToQueue } = require("../queues/moveMessageToLabel.processor");
const { decrementReplyExpected, incrementReplyExpected } = require("../controllers/warmupSettings.controller");
// const { removeJobFromQueue: removeJobFromReplyQueue } = require("../processors/replyWarmupEmails.processors");

const sendWarmupEmailsJob = async (job) => {
    const {
        _id,
        userId,
        parentId,
        emailTemplateId,
        threadId,
        threadOrder,
        isLastThreadOrder,
        senderProviderId,
        receiverProviderId,
        mailSubject,
        mailBody,
        isRepliedLog,
        repliedToMessageId,
        roomId
    } = job.data;

    let mailOptions;

    // here we are checking that current queue is for reply queue or not
    if (isRepliedLog === true) {
        mailOptions = {
            from: `${senderProviderId.senderName} <${senderProviderId.userName}>`,
            to: `${receiverProviderId.senderName} <${receiverProviderId.userName}>`,
            subject: mailSubject,
            html: mailBody,
            inReplyTo: repliedToMessageId, //at the time of reply an email
            references: repliedToMessageId,
            headers: {
                "x-header-omniwarm-service": process.env.WARMUP_HEADER_KEY
            },
            messageId: `<${uuidv4()}@omniwarm.com>`
        };
    } else {
        mailOptions = {
            from: `${senderProviderId.senderName} <${senderProviderId.userName}>`,
            to: `${receiverProviderId.senderName} <${receiverProviderId.userName}>`,
            subject: mailSubject,
            html: mailBody,
            headers: {
                "x-header-omniwarm-service": process.env.WARMUP_HEADER_KEY
            },
            messageId: `<${uuidv4()}@omniwarm.com>`
        };
    }

    try {
        // we need to create log to identify whether the mail is of conversation or fresh mail
        const response = await sendEmailViaSMTP(mailOptions, senderProviderId);

        if (response) {
            Promise.all([
                // writeLoggerFile({
                //     logType: "Send warmup emails cron.",
                //     messageId: response.messageId,
                //     timeStamps: new Date()
                // }),
                // create the email logs with sendStatus==COMPLETED
                createWarmupEmailLogs({
                    userId: userId._id,
                    parentId,
                    emailTemplateId,
                    threadId,
                    threadOrder,
                    isLastThreadOrder,
                    senderProviderId: senderProviderId._id,
                    receiverProviderId: receiverProviderId._id,
                    mailSubject,
                    mailBody,
                    isRepliedLog,
                    repliedToMessageId: response.messageId,
                    roomId
                }, response, "COMPLETED"),

                // delete the email queue
                deleteWarmupEmailQueue(_id)
            ])
                // .then(() => logger.log('info', `Sent email response promise resolved`))
                .catch(error => logger.log("error", `Response promise rejected: ${error.message}`))

            // create the room for the sender and receiver users. So that, receiver to reply their sender
            let coolDownMinute = getMinutes(); // it will return random minutes b/w 11-2880 
            // get the queuePickDate and queuePickTime wrt coolDownMinute - 10
            const { date, time } = getUTCAddedTime(coolDownMinute - 10);

            if (isRepliedLog === true) {
                // this is reply warmup email. So, we need to find the log where {
                //     roomId,
                //     emailTemplateId,
                //     threadOrder: threadOrder - 1,
                //     senderProviderId: new Types.ObjectId(receiverProviderId),
                //     receiverProviderId: new Types.ObjectId(senderProviderId)
                // }
                // once we have the log then we can update it with new eventLogs { eventStatus: "REPLIED" }
                if (isLastThreadOrder) {
                    Promise.all([
                        updateWarmupEmailRoom(roomId, {
                            senderProviderId: senderProviderId._id,
                            receiverProviderId: receiverProviderId._id,
                            threadOrder,
                            emailMessageId: response.messageId,
                            coolDownMinute,
                            queuePickDate: date,
                            queuePickTime: time,
                            pickedForTheDay: false
                        }),

                        updateReplyEventInWarmupEmailLogs(
                            roomId,
                            senderProviderId._id,
                            receiverProviderId._id,
                            emailTemplateId,
                            threadOrder - 1
                        ),

                        decrementReplyExpected(receiverProviderId.userId, receiverProviderId._id)
                    ])
                        .then(results => logger.log('info', `REPLIED event promise resolved for isLastThreadOrder ${isLastThreadOrder}`))
                        .catch(error => logger.log('error', `REPLIED event promise rejected: ${error.message}`))
                } else {
                    Promise.all([
                        updateWarmupEmailRoom(roomId, {
                            senderProviderId: senderProviderId._id,
                            receiverProviderId: receiverProviderId._id,
                            threadOrder,
                            emailMessageId: response.messageId,
                            coolDownMinute,
                            queuePickDate: date,
                            queuePickTime: time,
                            pickedForTheDay: false
                        }),

                        updateReplyEventInWarmupEmailLogs(
                            roomId,
                            senderProviderId._id,
                            receiverProviderId._id,
                            emailTemplateId,
                            threadOrder - 1
                        ),

                        decrementReplyExpected(receiverProviderId.userId, receiverProviderId._id),
                        incrementReplyExpected(senderProviderId.userId, senderProviderId._id)
                    ])
                        .then(results => logger.log('info', `REPLIED event promise resolved`))
                        .catch(error => logger.log('error', `REPLIED event promise rejected: ${error.message}`))
                }

            } else {
                Promise.all([
                    createWarmupEmailRoom({
                        roomId,
                        creatorId: userId._id,
                        senderProviderId: senderProviderId._id,
                        receiverProviderId: receiverProviderId._id,
                        emailTemplateId,
                        emailSubject: mailSubject,
                        threadOrder,
                        threadEnd: false,
                        emailMessageId: response.messageId,
                        coolDownMinute,
                        queuePickDate: date,
                        queuePickTime: time,
                        pickedForTheDay: false
                    }),

                    incrementReplyExpected(senderProviderId.userId, senderProviderId._id)
                ])
            }

            // create the config and move warmup email to label from INBOX
            // const config = {
            //     imap: {
            //         user: receiverProviderId.userName,
            //         password: await decrypted(receiverProviderId.userId, receiverProviderId.password),
            //         host: receiverProviderId.imapHost,
            //         port: receiverProviderId.imapPort,
            //         tls: true,
            //         authTimeout: 10000,
            //         tlsOptions: { servername: receiverProviderId.imapHost },
            //     },
            //     userId,
            //     providerId: senderProviderId._id
            // };
            // Call addJobToQueue to add a new job to the queue to move message from INBOX to LABEL
            // await addJobToQueue(config);

        } else {
            let error = new Error()
            error.message = `Response (${response}) not appropriate while sending the warm-up email of roomID ${roomId}.`
            error.status = 500
            throw error;
        }
    } catch (error) {
        // we need to check the error message whether user cred is incorrect or not.
        if (
            error.message.includes("Invalid credentials") ||
            error.message.includes("Invalid login") ||
            error.message.includes("535")
        ) {
            Promise.all([
                // we need to disconnect and deactivate warmup in the SMTP data for the current providerData
                disconnectSMTPprovider(senderProviderId._id),
                // delete the all queue related to senderProviderId
                deleteWarmupEmailQueuesByProviderID(senderProviderId._id),
                // remove the queue from redis as well if they are in waiting state 
                // removeJobFromReplyQueue(senderProviderId._id),

                // change the sendStatus to PENDING of the current queue
                updateWarmupEmailQueueStatus(_id, "PENDING"),
                // send the notification mail to the user email with details of the provider.
                // sendEmailForSmtpDisconnected(userId.email, senderProviderId.userName),

                writeLoggerFile({
                    status: error.status,
                    "logType": "Error log while provider cred is wrong.",
                    "error": `${error.message}`,
                    message: `Paused the warmup for the user: ${userId.id} provider: ${senderProviderId._id} queueId: ${_id} & roomId: ${roomId}.`,
                    "timestamp": new Date()
                })
            ])
                .then(results => logger.log('info', `SMTP invalid login promise resolved: ${results}`))
                .catch(error => logger.log('error', `SMTP invalid login promise rejected: ${error.message}`))

        } else {
            Promise.all([
                // updateWarmupEmailQueueStatus(_id, "FAILED"),
                deleteWarmupEmailQueue(_id),
                deleteWarmupEmailRoom(roomId),
                writeLoggerFile({
                    "logType": "Update the log sendStatus is FAILED.",
                    "error": `${error.message}`,
                    providerId: senderProviderId._id,
                    "queueID": _id,
                    "roomID": roomId,
                    "timestamp": new Date()
                })
            ])
                .then(results => logger.log('info', `Inside catch promise resolved: ${results}`))
                .catch(error => logger.log('error', `Inside catch promise rejected: ${error.message}`))
        }
    }
}

module.exports = {
    sendWarmupEmailsJob
};