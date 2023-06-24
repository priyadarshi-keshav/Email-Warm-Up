const { Schema, model } = require("mongoose");
const User = require("./user.schema");

const warmupEmailQueueSchema = new Schema({

    userId: { type: Schema.Types.ObjectId, required: true, ref: User },

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

    sendCronTime: { type: String, required: true },

    sendCronDate: { type: String, required: true },

    isRepliedLog: { type: Boolean, required: true },

    // this field only valid for reply email queue
    repliedToMessageId: { type: String, default: null, required: false },

    roomId: { type: String, required: true },

    label: { type: String, required: true },

    sendStatus: { type: String, enum: ['PENDING', 'SENDING', 'FAILED', 'COMPLETED'], required: true }
}, {
    timestamps: true
})

const warmupEmailQueue = model("warmupemailqueues", warmupEmailQueueSchema);

module.exports = warmupEmailQueue;