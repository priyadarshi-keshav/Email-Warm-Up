const { v4: uuidv4 } = require("uuid");
const { createEmailQueue } = require("../controllers/warmupEmailQueue.controller");
const { getWarmupEmailTemplates } = require("../controllers/warmupEmailTemplates.controller");
const { getTime, getUTCAddedTime } = require("../utils/helpers/moment.helper");
const { Spintax } = require("../utils/helpers/spintex.helper");
const { RandomTagsGenerator } = require("../utils/helpers/randomTags.helper");
const { handlebarCompiler } = require("../utils/helpers/handleBarCompiler.helper");


const createWarmupQueueJob = async (job) => {
    const { receiverProviderData, senderProviderData, userId } = job.data;

    let warmupEmailTemplateData = await getWarmupEmailTemplates();
    const emailThreadData = warmupEmailTemplateData.emailThreads.filter(item => item.threadOrder === 0)[0];

    let mailBody = Spintax(emailThreadData.mailBody, warmupEmailTemplateData._id);
    let mailSubject = Spintax(emailThreadData.mailSubject, warmupEmailTemplateData._id);

    mailBody = handlebarCompiler(mailBody, {
        receiversFirstName: receiverProviderData.senderName,
        sendersFirstName: senderProviderData.senderName
    });

    mailSubject = handlebarCompiler(mailSubject, {
        receiversFirstName: receiverProviderData.senderName,
        sendersFirstName: senderProviderData.senderName
    });

    // get the sendDate and sendTime
    // 24*60 minutes = 1440 minutes == 1 Day
    // const { date } = getUTCAddedTime(process.env.NODE_ENV == "PRODUCTION" ? 1440 : 1); 
    const { date } = getUTCAddedTime(1440);

    // create the email warmup queue 
    const emailQueueData = {
        userId,
        parentId: "omni",
        emailTemplateId: warmupEmailTemplateData._id,
        threadId: emailThreadData._id,
        threadOrder: emailThreadData.threadOrder,
        isLastThreadOrder: false,
        senderProviderId: senderProviderData._id,
        receiverProviderId: receiverProviderData._id,
        mailSubject: `${mailSubject} | ${RandomTagsGenerator()}`,
        mailBody,
        sendCronTime: getTime(), // getTime will return random time in format "00:00:00"
        sendCronDate: date, // YYYY-MM-DD
        isRepliedLog: false,
        roomId: uuidv4(),
        label: process.env.LABEL_NAME,
        sendStatus: "PENDING"
    };

    await createEmailQueue(emailQueueData);

    return `Queue for user: ${userId}, sender:${senderProviderData._id} with receiver: ${receiverProviderData._id} is made.`
}

module.exports = {
    createWarmupQueueJob
}