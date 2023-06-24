const { resetWarmupSetting } = require("../controllers/warmupSettings.controller");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");

const ResetWarmupSettings = async () => {
    try {
        writeLoggerFile({
            logType: "Debugging",
            message: "Cron for reset function is active.",
            timestamps: new Date()
        })

        await resetWarmupSetting();

        return;

    } catch (error) {
        writeLoggerFile({
            logType: "Reset warmup settings.",
            error: error.message,
            timeStamp: new Date()
        })

        return;
    }
}

module.exports = { 
    ResetWarmupSettings 
};