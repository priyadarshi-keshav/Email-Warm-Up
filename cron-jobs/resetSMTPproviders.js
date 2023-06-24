const { resetSMTPproviders } = require("../controllers/smtp.controllers");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");

const ResetSMTPproviders = async () => {
    try {
        await resetSMTPproviders();

        return;

    } catch (error) {
        writeLoggerFile({
            logType: "Reset SMTP providers.",
            error: error.message,
            timeStamp: new Date()
        })

        return;
    }
}

module.exports = { 
    ResetSMTPproviders 
};