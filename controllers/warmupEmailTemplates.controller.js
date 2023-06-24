const warmupEmailTemplatesModel = require("../models/warmupEmailTemplates.schema");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");

module.exports = {
    getWarmupEmailTemplates: async () => {
        try {
            const templateData = await warmupEmailTemplatesModel.aggregate([
                {
                    $sample: {
                        size: 1
                    }
                }
            ]);

            return templateData[0];
            
        } catch (error) {
            writeLoggerFile({
                logType: "Warm up template controller getWarmupEmailTemplates",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },

    getWarmupEmailTemplate: async (emailTemplateId) => {
        try {
            const templateData = await warmupEmailTemplatesModel.findOne({ _id: emailTemplateId });

            return templateData;
        } catch (error) {
            writeLoggerFile({
                logType: "Warm up template controller getWarmupEmailTemplate",
                error: error.message,
                timeStamps: new Date()
            })
        }
    },
}