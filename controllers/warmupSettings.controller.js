const warmupSettingsModel = require("../models/warmupSettings.schema");
const { getWarmupSettingCache, setWarmupSettingCache } = require("../cache/warmupSetting.cache");
const { getTotalQueueCount } = require("./warmupEmailQueue.controller")
const { getTotalSentAndReplyCount } = require("./warmupEmailLogs.controller")
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { Types } = require("mongoose");

const getUpdatedReplyExpectedValue = async (userId, providerId, spamAlertActive) => {

    const { SPAM_REPLY_RATE_PERCENT, REPLY_RATE_PERCENT } = process.env
    const replyRate = spamAlertActive ? SPAM_REPLY_RATE_PERCENT : REPLY_RATE_PERCENT;

    // let totalQueueCount = 0;
    let totalSentCount = 0;
    let totalRepliedCount = 0;

    // const warmupEmailQueueCount = await getTotalQueueCount(userId, providerId);
    const warmupEmailLogCount = await getTotalSentAndReplyCount(userId, providerId);

    // totalQueueCount = warmupEmailQueueCount.queueCount;
    totalSentCount = warmupEmailLogCount.sentCount;
    totalRepliedCount = warmupEmailLogCount.repliedCount;

    // const updatedReplyExpectedValue = Math.round((+replyRate / 100 * (totalQueueCount + totalSentCount)) - totalRepliedCount)
    const updatedReplyExpectedValue = Math.round((+replyRate / 100 * totalSentCount) - totalRepliedCount)

    return updatedReplyExpectedValue < 0 ? 0 : updatedReplyExpectedValue;
};

module.exports = {
    // this controller is only use for creating the queue body thats why we use pickedForTheDay filter this cannot be used to check for users who has enabled their warmup or not
    getWarmupSettings: async () => {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const warmupSettingsData = await warmupSettingsModel.aggregate([
                {
                    $match: {
                        pickedForTheDay: false,
                        // lastPickedDay: {
                        //     $gte: yesterday,
                        //     $lt: today
                        // }
                    }
                },
                {
                    $lookup: {
                        from: "smtps",
                        localField: "providerId",
                        foreignField: "_id",
                        as: "providerData"
                    }
                },
                {
                    $match: {
                        "providerData.isDisconnected": false,
                        "providerData.isWarmupActive": true
                    }
                },
                {
                    $limit: 30
                }
            ]);

            return warmupSettingsData;

        } catch (error) {
            writeLoggerFile({
                logType: "Warmup Settings Controller getWarmupSettings.",
                error: error.message,
                timeStamp: new Date()
            });
        }
    },

    pickedWarmupSettings: async (idList) => {
        try {
            const response = await warmupSettingsModel.updateMany(
                { _id: { $in: idList } },
                {
                    lastPickedDay: new Date(),
                    pickedForTheDay: true
                }
            )

            // writeLoggerFile({
            //     logType: "pickedWarmupSettings controller.",
            //     idList,
            //     response,
            //     timeStamps: new Date()
            // })

            return response;

        } catch (error) {
            writeLoggerFile({
                logType: "Warmup Settings Controller pickedWarmupSettings.",
                error: error.message,
                timeStamp: new Date()
            });
        }
    },

    getReplyExpected: async (userId) => {
        try {
            // const warmupSettingDataCache = await getWarmupSettingCache(userId)

            // if (warmupSettingDataCache) {
            //     return warmupSettingDataCache;
            // }

            const warmupSettingData = await warmupSettingsModel.findOne({
                userId
            });
            // await setWarmupSettingCache(userId, warmupSettingData);
            return warmupSettingData;
        } catch (error) {
            writeLoggerFile({
                logType: "Warmup Settings Controller getReplyExpected.",
                error: error.message,
                timeStamp: new Date()
            });
        }
    },

    // @UPDATE QUERY
    incrementReplyExpected: async (userId, providerId) => {
        try {
            const warmupSetting = await warmupSettingsModel.findOne({
                userId,
                providerId: new Types.ObjectId(providerId)
            })

            if (warmupSetting) {
                // const { spamAlertActive } = warmupSetting;
                // const updatedReplyExpectedValue = await getUpdatedReplyExpectedValue(userId, providerId, spamAlertActive);

                const updatedReplyExpectedValue = await getUpdatedReplyExpectedValue(userId, providerId, false);

                let response = await warmupSettingsModel.updateOne({
                    userId,
                    providerId: new Types.ObjectId(providerId)
                }, {
                    replyExpected: updatedReplyExpectedValue
                });

                response = {
                    "_id": warmupSetting._id,
                    "userId": warmupSetting.userId,
                    "providerId": warmupSetting.providerId,
                    "day": warmupSetting.day,
                    "limit": warmupSetting.limit,
                    "pickedForTheDay": warmupSetting.pickedForTheDay,
                    "replyExpected": updatedReplyExpectedValue,
                }

                // we need to update the cache as well
                writeLoggerFile({
                    logType: "Warmup Settings Controller incrementReplyExpected.",
                    message: `Reply expected for user ${userId} has been updated.`,
                    response,
                    timeStamp: new Date()
                });

                return response;
            }

        } catch (error) {
            writeLoggerFile({
                status: error.status,
                logType: "Warmup Settings Controller incrementReplyExpected.",
                error: error.message,
                timeStamp: new Date()
            });
        }
    },

    // @UPDATE QUERY
    decrementReplyExpected: async (userId, providerId) => {
        try {
            let getResponse = await warmupSettingsModel.findOne({
                userId,
                providerId: new Types.ObjectId(providerId)
            });
            let response;
            if (getResponse?.replyExpected > 0) {
                response = await warmupSettingsModel.findOneAndUpdate(
                    { userId },
                    {
                        $inc: { replyExpected: -1 }
                    },
                    { new: true }
                )
            }

            // we need to update the cache as well
            // writeLoggerFile({
            //     logType: "Warmup Settings Controller decrementReplyExpected.",
            //     message: `Reply expected for user ${userId} has been decrement by ${response ? 1 : 0}.`,
            //     response: {
            //         "_id": response ? response._id : getResponse._id,
            //         "userId": response ? response.userId : getResponse.userId,
            //         "providerId": response ? response.providerId : getResponse.providerId,
            //         "day": response ? response.day : getResponse.day,
            //         "limit": response ? response.limit : getResponse.limit,
            //         "pickedForTheDay": response ? response.pickedForTheDay : getResponse.pickedForTheDay,
            //         "replyExpected": response ? response.replyExpected : getResponse.replyExpected,
            //     },
            //     timeStamp: new Date()
            // });
            return response;
        } catch (error) {
            writeLoggerFile({
                logType: "Warmup Settings Controller decrementReplyExpected.",
                message: error.message,
                timeStamp: new Date()
            });
        }
    },

    // @UPDATE QUERY
    resetWarmupSetting: async () => {
        try {
            const { INCREASE_PER_DAY, DAILY_WARMUP_LIMIT } = process.env;
            const today = new Date(`${new Date().toISOString().split("T")[0]}T00:00:00Z`);

            // update day, limit and pickedForTheDay value for spam deactivated provider
            const incrementDayLimit = await warmupSettingsModel.updateMany(
                {
                    pickedForTheDay: true,
                    lastPickedDay: { $lt: today },
                    spamAlertActive: false
                },
                {
                    pickedForTheDay: false,
                    $inc: {
                        day: 1,
                        limit: INCREASE_PER_DAY,
                    },
                });

            // update day, and pickedForTheDay value for spam active provider
            const incrementDay = await warmupSettingsModel.updateMany({
                pickedForTheDay: true,
                lastPickedDay: { $lt: today },
                spamAlertActive: true
            }, {
                $inc: {
                    day: 1
                },
                pickedForTheDay: false
            });

            const normalisingLimit = await warmupSettingsModel.updateMany({
                spamAlertActive: false,
                limit: { $gt: DAILY_WARMUP_LIMIT },
            }, {
                limit: DAILY_WARMUP_LIMIT
            })

            writeLoggerFile({
                logType: "Warmup Settings Controller resetWarmupSetting.",
                today,
                updateDayLimit: {
                    message: "Updated the day and limit.",
                    incrementDayLimit,
                    incrementDay,
                    normalisingLimit
                },
                timeStamp: new Date()
            });

            return;

        } catch (error) {
            writeLoggerFile({
                logType: "Warmup Settings Controller resetWarmupSetting.",
                error: error.message,
                timeStamp: new Date()
            });
        }
    }
}