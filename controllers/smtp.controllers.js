const { Types } = require("mongoose");
const smtpModel = require("../models/smtp.schema");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");

module.exports = {
    getSmtpProviders: async (providerId, limit) => {
        try {
            const { DAILY_WARMUP_LIMIT } = process.env
            const providersData = await smtpModel.aggregate([
                {
                    $match: {
                        providerId: {
                            $ne: new Types.ObjectId(providerId)
                        },
                        isWarmupActive: true
                    }
                },
                {
                    $sample: {
                        // we need to add one cron that checks for limit availability
                        // size: Math.min(limit, NODE_ENV == "PRODUCTION" ? +DAILY_WARMUP_LIMIT : 5)
                        size: Math.min(limit, +DAILY_WARMUP_LIMIT)
                    }
                }
            ]);

            return providersData;

        } catch (error) {
            writeLoggerFile({
                logType: "SMTP controller getSmtpProviders",
                error: error.message,
                timeStamp: new Date()
            })
        }
    },

    disconnectSMTPprovider: async (providerId) => {
        try {
            await smtpModel.findOneAndUpdate(
                { _id: providerId },
                {
                    isDisconnected: true,
                    isWarmupActive: false
                }
            )

            return;
        } catch (error) {
            writeLoggerFile({
                status: error.status,
                "logType": `Disconnect SMTP provider ${providerId} from SMTPController.`,
                "error": `${error.message}`,
                "timestamp": new Date()
            })
        }
    },

    getActiveSMTPProviders: async () => {
        try {
            const SMTP_Providers = await smtpModel.find(
                {
                    isWarmupActive: true,
                    isDisconnected: false,
                    pickedForTheDay: false
                }
            ).limit(20)

            return SMTP_Providers;
        } catch (error) {
            writeLoggerFile({
                status: error.status,
                "logType": `getActiveSMTPProviders from SMTPController.`,
                "error": `${error.message}`,
                "timestamp": new Date()
            })
        }
    },

    markedSMTPasPicked: async (idList) => {
        try {
            const response = await smtpModel.updateMany(
                { _id: { $in: idList } },
                { pickedForTheDay: true }
            );

            writeLoggerFile({
                "logType": `markedSMTPasPicked from SMTPController.`,
                response,
                "timestamp": new Date()
            })

        } catch (error) {
            writeLoggerFile({
                status: error.status,
                "logType": `markedSMTPasPicked from SMTPController.`,
                "error": `${error.message}`,
                "timestamp": new Date()
            })
        }
    },

    resetSMTPproviders: async () => {
        try {
            const response = await smtpModel.updateMany(
                { pickedForTheDay: true },
                { pickedForTheDay: false }
            );

            writeLoggerFile({
                "logType": `resetSMTPproviders from SMTPController.`,
                response,
                "timestamp": new Date()
            })

        } catch (error) {
            writeLoggerFile({
                status: error.status,
                "logType": `resetSMTPproviders from SMTPController.`,
                "error": `${error.message}`,
                "timestamp": new Date()
            })
        }
    },

}