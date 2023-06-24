const imaps = require('imap-simple');
const { disconnectSMTPprovider } = require("../controllers/smtp.controllers");
const { logger } = require("../logger");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");

const moveMessageToLabelJob = async (job) => {
    const { imap, providerId } = job.data;

    try {
        const connection = await imaps.connect({ imap });

        connection.on('error', (error) => {
            connection.end();
            logger.log('error', `IMAP Connection Error: ${error.message}`);
        });

        logger.log('info', `Connection built: ${imap.user}`);

        const boxes = await connection.getBoxes();
        if (!boxes[process.env.LABEL_NAME]) {
            await connection.addBox(process.env.LABEL_NAME);
            logger.log('info', `Label created for provider ${imap.user}`);
        }

        await connection.openBox('INBOX', false);

        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            struct: true,
        };

        const results = await connection.search(searchCriteria, fetchOptions);

        const UIDs = results
            ?.filter((item) => {
                return (
                    item.parts.filter((part) => part.which === 'HEADER')[0]
                        .body['x-header-omniwarm-service'] == process.env.WARMUP_HEADER_KEY
                );
            })
            .map(function (res) {
                return res.attributes.uid.toString();
            });

        if (UIDs.length > 0) {
            //Mark message for Read
            // await connection.addFlags(UID, ['\\Seen'], (err) => {
            connection.addFlags(UIDs, ['\\Seen'], (err) => {
                if (err) {
                    logger.log("error", 'Problem marking message as read');
                }
                else {
                    logger.log("info", 'Marked message as read');
                }
            })

            await connection.moveMessage(UIDs, process.env.LABEL_NAME);
            logger.log('info', `Message(s) moved to label for user: ${imap.user}`);
            writeLoggerFile({
                level: 'info',
                providerId,
                imap_user: imap.user,
                message: 'Message moved to label',
            });
            // return `Message(s) moved to label for user: ${imap.user}`;
        }

        ////// Code to mark the thread messages inside the warmup label to mark as read ///////////////////////////////////
        await connection.openBox('process.env.LABEL_NAME', false);

        const searchCriteriaWarmup = ['UNSEEN'];
        const fetchOptionsWarmup = {
            bodies: ['HEADER', 'TEXT'],
            struct: true,
        };

        const resultsWarmup = await connection.search(searchCriteriaWarmup, fetchOptionsWarmup);

        const UIDsWarmup = resultsWarmup
            ?.filter((item) => {
                return (
                    item.parts.filter((part) => part.which === 'HEADER')[0]
                        .body['x-header-omniwarm-service'] == process.env.WARMUP_HEADER_KEY
                );
            })
            .map(function (res) {
                return res.attributes.uid.toString();
            });

        if (UIDsWarmup.length > 0) {
            //Mark message for Read
            connection.addFlags(UIDs, ['\\Seen'], (err) => {
                if (err) {
                    logger.log("error", 'Problem marking message as read');
                }
                else {
                    logger.log("info", 'Marked message as read');
                }
            })

            logger.log('info', `Message(s) marked as read in the Omniwarm-services label for user: ${imap.user}`);
            writeLoggerFile({
                level: 'info',
                providerId,
                imap_user: imap.user,
                message: 'Message marked as read in Omniwarm-services label',
            });
            // return `Message(s)marked as read in the Omniwarm-services label for user: ${imap.user}`;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


        await connection.end();
        return `Connection closed for user: ${imap.user} having UIDs size ${UIDs.length}`;
    } catch (error) {
        writeLoggerFile({
            level: 'error',
            providerId,
            imap_user: imap.user,
            error: error.message,
        });

        if (
            error.message.includes('Invalid login') ||
            error.message.includes('535') ||
            error.message.includes('account is not enabled for IMAP') ||
            error.message.includes('LOGIN failed') ||
            error.message.includes('You are yet to enable IMAP for your account')
        ) {
            await disconnectSMTPprovider(providerId);
            logger.log('info', `IMAP invalid login: Provider ${imap.user} disconnected from SMTP`);
        } else {
            throw new Error(`Message move failed for user: ${imap.user}, Error: ${error.message}`);
        }
    }
};


module.exports = {
    moveMessageToLabelJob
}
