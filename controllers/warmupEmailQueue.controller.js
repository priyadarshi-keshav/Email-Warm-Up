const { logger } = require("../logger");
const warmupEmailQueueModel = require("../models/warmupEmailQueue.schema");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { getUTCCurrentTime } = require("../utils/helpers/moment.helper");
const { Types } = require("mongoose");

module.exports = {

    createEmailQueue: async (emailQueueData) => {
        try {
            const { roomId } = emailQueueData;

            await warmupEmailQueueModel.findOneAndUpdate(
                { roomId },
                emailQueueData,
                { upsert: true }
            );

            return;

        } catch (error) {
            writeLoggerFile({
                logType: "Email queue controller createEmailQueue.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    // getWarmupEmailQueues: async (enabledUserIDList) => {
    getWarmupEmailQueues: async ({ isRepliedLog }) => {
        try {
            const { date, time } = getUTCCurrentTime();

            // let previousDate = new Date();
            // previousDate.setDate(previousDate.getDate() - 60);
            // previousDate = previousDate.toISOString().split("T")[0];

            const warmupQueueDataList = await warmupEmailQueueModel.find({
                isRepliedLog,
                sendStatus: "PENDING",
                sendCronTime: { $lte: time },
                sendCronDate: { $lte: date },
                // $and: [
                //     { sendCronDate: { $gte: previousDate } },
                //     { sendCronDate: { $lte: date } }
                // ]
            })
                .populate("senderProviderId")
                .populate("receiverProviderId")
                .populate("userId", "email")
                .limit(200)

            return warmupQueueDataList;

        } catch (error) {
            writeLoggerFile({
                logType: "Email queue controller getWarmupEmailQueues.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    getWarmupEmailQueue: async (userId) => {
        try {
            const { date, time } = getUTCCurrentTime();
            const warmupQueueData = await warmupEmailQueueModel.findOne({
                userId: userId.toString(),
                sendStatus: "PENDING",
                sendCronDate: date,
                sendCronTime: { $lte: time }
            })
            return warmupQueueData;
        } catch (error) {
            writeLoggerFile({
                logType: "Email queue controller getWarmupEmailQueue.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    updateManyQueueStatus: async (idList, sendStatus) => {
        try {
            if (sendStatus === "SENDING" || sendStatus === "PENDING") {

                const response = await warmupEmailQueueModel.updateMany(
                    { _id: { $in: idList } },
                    { sendStatus }
                )

                await writeLoggerFile({
                    logType: "Email queue controller updateManyQueueStatus",
                    sendStatus,
                    totalQueue: idList.length,
                    response,
                    timeStamps: new Date()
                })

                return;
            }

        } catch (error) {
            writeLoggerFile({
                logType: "Email queue controller updateWarmupEmailQueueStatus.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    updateWarmupEmailQueueStatus: async (_id, sendStatus) => {
        try {
            if (sendStatus === "SENDING" || sendStatus === "FAILED" || sendStatus === "PENDING") {
                await warmupEmailQueueModel.findByIdAndUpdate(
                    { _id },
                    { sendStatus }
                )
                return;
            } else {
                throw new Error("Please pass correct sendStatus value.")
            }
        } catch (error) {
            writeLoggerFile({
                logType: "Email queue controller updateWarmupEmailQueueStatus.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    deleteWarmupEmailQueuesByID: async (idList) => {
        try {

            const response = await warmupEmailQueueModel.deleteMany({
                _id: { $in: idList }
            })

            await writeLoggerFile({
                logType: "Email queue controller deleteWarmupEmailQueuesByID.",
                response,
                timeStamps: new Date()
            })

            return;

        } catch (error) {
            await writeLoggerFile({
                logType: "Email queue controller deleteWarmupEmailQueuesByID.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    deleteWarmupEmailQueuesByProviderID: async (providerId) => {
        try {

            const response = await warmupEmailQueueModel.deleteMany({
                $or: [
                    { senderProviderId: providerId },
                    { receiverProviderId: providerId },
                ]
            })

            await writeLoggerFile({
                logType: "Email queue controller deleteWarmupEmailQueuesByProviderID.",
                response,
                timeStamps: new Date()
            })

            return;

        } catch (error) {
            await writeLoggerFile({
                logType: "Email queue controller deleteWarmupEmailQueuesByID.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    deleteWarmupEmailQueue: async (_id) => {
        try {
            await warmupEmailQueueModel.findByIdAndDelete({ _id })
            return;
        } catch (error) {
            writeLoggerFile({
                logType: "Email queue controller deleteWarmupEmailQueue.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    getTotalQueueCount: async (userId, providerId) => {
        try {
            const queueCount = await warmupEmailQueueModel.count({
                userId: new Types.ObjectId(userId),
                senderProviderId: new Types.ObjectId(providerId),
                sendStatus: {
                    $in: ["PENDING", "SENDING"]
                }
            });

            return {
                queueCount: queueCount ? queueCount : 0
            };

        } catch (error) {
            writeLoggerFile({
                status: error.status,
                logType: "Email queue controller getTotalQueueCount.",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    queueResetToPending: async () => {
        try {
            const response = await warmupEmailQueueModel.updateMany({
                sendStatus: "SENDING"
            }, {
                sendStatus: "PENDING"
            })

            logger.log('info', JSON.stringify({
                logType: "Reset all SENDING state queue to PENDING.",
                response
            }))
            writeLoggerFile({
                logType: "Reset all SENDING state queue to PENDING.",
                response
            })

            return;
        } catch (error) {
            writeLoggerFile({
                logType: "Reset fail while updating queue status from SENDING to PENDING.",
                error: error.message
            })
        }
    }
}