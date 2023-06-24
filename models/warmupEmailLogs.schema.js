const { Schema, model } = require("mongoose");

const warmupEmailLogsSchema = new Schema({

    userId: { type: Schema.Types.ObjectId, required: true, ref: "user" },

    parentId: { type: String, required: true },

    emailTemplateId: { type: Schema.Types.ObjectId, required: true, ref: "warmupemailtemplates" },

    threadId: { type: String, required: true },

    threadOrder: { type: Number, required: true },

    // this value prevent the miscalculation of reply expectation
    // for dashboard: replyRate% = totalReplied/(totalSent-totalSentForLastThread) * 100
    isLastThreadOrder: { type: Boolean, required: true },
    
    // receiverProviderData: { type: Object, required: true },
    senderProviderId: { type: Schema.Types.ObjectId, required: true, ref: "Smtp" },

    receiverProviderId: { type: Schema.Types.ObjectId, required: true, ref: "Smtp" },

    mailSubject: { type: String, required: true },

    mailBody: { type: String, required: true },

    // emailProvider: { type: String, required: true },

    // emailProviderData: { type: Object, required: true },

    folderStatus: { type: String, required: true, default: "INBOX", enum: ["INBOX", "SPAM"], },

    isRepliedLog: { type: Boolean, required: true },

    repliedToMessageId: { type: String, default: null },

    roomId: { type: String },

    label: { type: String, required: true },

    event: {
        required: false,
        type: String,
        default: ''
    },

    eventLogs: [{
        eventStatus: String,
        timeStamp: Date
    }],

    response: { type: Object, required: false },

    sendStatus: { type: String, required: true, default: 'PENDING', enum: ['PENDING', 'SENDING', 'FAILED', 'COMPLETED'] }
}, {
    timestamps: true
})

const warmupEmailLogs = model("warmupemaillogs", warmupEmailLogsSchema);

module.exports = warmupEmailLogs;