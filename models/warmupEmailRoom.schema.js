const { Schema, model } = require("mongoose")

const warmupEmailRoomSchema = new Schema({

    roomId: { type: String, required: true },

    creatorId: { type: String, required: true },

    senderProviderId: { type: Schema.Types.ObjectId, required: true, ref: "Smtp" },

    receiverProviderId: { type: Schema.Types.ObjectId, required: true, ref: "Smtp" },

    // emailTemplateId will be common in every individual room
    emailTemplateId: { type: Schema.Types.ObjectId, required: true, ref: "warmupemailtemplates" },

    // emailSubject will be common in every individual room
    emailSubject: { type: String, required: true },

    threadOrder: { type: Number, required: true },

    threadEnd: { type: Boolean, default: false },

    emailMessageId: { type: String, required: true },

    coolDownMinute: { type: Number, required: true },

    queuePickDate: { type: String, required: true }, // this date is calculated from coolDownMinute

    queuePickTime: { type: String, required: true }, // this time is less than 10 min from coolDownMinute

    pickedForTheDay: { type: Boolean, default: false },

    // isSenderActive: { type: Boolean, default: true },

    // isReceiverActive: { type: Boolean, default: true },

    // deactivated: { type: Boolean, default: false, required: true }

}, {
    timestamps: true
})

const warmupEmailRoom = model("warmupemailrooms", warmupEmailRoomSchema)

module.exports = warmupEmailRoom;
