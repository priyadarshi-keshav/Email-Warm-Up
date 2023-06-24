const { addJobToQueue, queueName } = require("../queues/moveMessageToLabel.queue");
const { decrypted } = require("../utils/helpers/crypter.helper");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const { getActiveSMTPProviders, markedSMTPasPicked } = require("../controllers/smtp.controllers");

const moveMessagesToOmniwarmLabelImap = async () => {
    try {
        const SMTP_Providers = await getActiveSMTPProviders();

        await markedSMTPasPicked(SMTP_Providers.map(item => item._id));

        let jobList = [];

        for (let provider of SMTP_Providers) {
            let host = provider.imapHost;
            let userId = provider.userId;
            let password = provider.password;

            const config = {
                imap: {
                    user: provider.userName,
                    password: await decrypted(userId, password),
                    host,
                    port: provider.imapPort,
                    tls: true,
                    authTimeout: 20000,
                    tlsOptions: { servername: host },
                },
                providerId: provider._id
            };

            jobList.push({
                name: queueName,
                data: config,
                opts: {
                    removeOnComplete: {
                        age: 48 * 3600
                    },
                    removeOnFail: {
                        age: 48 * 3600
                    }
                }
            });
        };

        addJobToQueue(jobList);

    } catch (error) {
        await writeLoggerFile({
            logType: "Move emails to label.",
            error: error.message,
            timestamp: new Date(),
        });
    }
}

module.exports = {
    moveMessagesToOmniwarmLabelImap
}