const { Types } = require("mongoose");
const warmupEmailRoomModel = require("../models/warmupEmailRoom.schema");
const warmupSettingsModel = require("../models/warmupSettings.schema");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { getUTCCurrentTime } = require("../utils/helpers/moment.helper");

module.exports = {
    createWarmupEmailRoom: async (roomBody) => {
        try {
            // await warmupEmailRoomModel.findOneAndUpdate(
            //     { roomId: roomBody?.roomId },
            //     roomBody,
            //     { upsert: true }
            // )
            await warmupEmailRoomModel.create(roomBody);
            return;
        } catch (error) {
            writeLoggerFile({
                logType: "Email room controller createWarmupEmailRoom",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    updateWarmupEmailRoom: async (roomId, roomBody) => {
        try {
            await warmupEmailRoomModel.findOneAndUpdate({ roomId }, roomBody)
            return;

        } catch (error) {
            writeLoggerFile({
                logType: "Email room controller updateWarmupEmailRoom",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    updatePickedForTheDayValue: async (roomIdList) => {
        try {
            const response = await warmupEmailRoomModel.updateMany(
                { roomId: { $in: roomIdList } },
                { pickedForTheDay: true }
            )

            return response;
        } catch (error) {
            await writeLoggerFile({
                logType: "Email room controller updatePickedForTheDayValue",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    closeWarmupEmailRoom: async (roomId) => {
        try {
            await warmupEmailRoomModel.findOneAndUpdate({
                roomId
            }, {
                threadEnd: true
            })

            // writeLoggerFile({
            //     logType: "Warmup room thread end: closeWarmupEmailRoom",
            //     message: `Warmup room thread end for the roomId ${roomId} where creator ID is ${response.creatorId}`,
            //     timeStamps: new Date()
            // })

            return;
        } catch (error) {
            writeLoggerFile({
                logType: "Email room controller closeWarmupEmailRoom",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    getWarmupEmailRooms: async (callForSpam) => {
        try {
            const { date, time } = getUTCCurrentTime();

            let previousDate = new Date();
            previousDate.setDate(previousDate.getDate() - 18);
            previousDate = previousDate.toISOString().split("T")[0];

            // we need to query all user settings which has reply expected 0< and warmup is active
            // according to providerId of settings we pick rooms wrt senderProviderId where we populate emailTemplateId, senderProvider, and receiverProviderId
            const replyExpectedProviders = await warmupSettingsModel.find({
                replyExpected: { $gt: 0 },
                spamAlertActive: callForSpam
            });

            const replyExpectedProvidersID = replyExpectedProviders.map(item => item.providerId);

            const warmupRoomsList = await warmupEmailRoomModel.find({
                senderProviderId: { $in: replyExpectedProvidersID },
                threadEnd: false,
                pickedForTheDay: false,
                // isReceiverActive: true,
                // isSenderActive: true,
                queuePickDate: { $lte: date },
                queuePickTime: { $lte: time }
            })
                .populate("senderProviderId")
                .populate("receiverProviderId")
                .populate("emailTemplateId")
                .sort({ updatedAt: 1 })
                .limit(100)

            return warmupRoomsList;

        } catch (error) {
            writeLoggerFile({
                logType: "Email room controller getWarmupEmailRooms",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    deleteWarmupEmailRoom: async (roomId) => {
        try {
            const response = await warmupEmailRoomModel.deleteOne({ roomId });
            writeLoggerFile({
                message: `Room ID ${roomId} is deleted as it failed while sending the warmup.`,
                response,
                timeStamps: new Date()
            })
            return;
        } catch (error) {
            writeLoggerFile({
                logType: `Email room controller deleteWarmupEmailRoom-roomId: ${roomId}`,
                error: error.message,
                timeStamps: new Date()
            })
        }

    },

    deleteManyWarmupEmailRoom: async (roomIDList) => {
        try {
            const response = await warmupEmailRoomModel.deleteMany({
                roomId: { $in: roomIDList }
            });

            await writeLoggerFile({
                logType: "Email queue controller deleteManyWarmupEmailRoom.",
                response,
                timeStamps: new Date()
            })

            return;

        } catch (error) {
            writeLoggerFile({
                logType: "Email room controller deleteWarmupEmailRoom",
                error: error.message,
                timeStamps: new Date()
            })
        }

    },
}