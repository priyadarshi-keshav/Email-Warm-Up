const { Schema, model } = require("mongoose")

const warmUserSettingsSchema = new Schema({
    userId: { type: String, required: true },

    providerId: { type: Schema.Types.ObjectId, required: true, ref: "Smtp" },

    day: { type: Number, required: true },

    limit: { type: Number, required: true },

    logsPerDay: [{
        day: { type: Number },
        limit: { type: Number },
        emails: [{
            type: String
        }],
        createdAt: { type: Date }
    }],

    pickedForTheDay: { type: Boolean, default: false, required: true },
    
    replyExpected: { type: Number, default: 1, required: true }, // 6-1 = 5....0

    spamAlertActive: { type: Boolean, default: false, required: true },
    
    lastPickedDay: { type: Date, default: new Date() },
    
    lastPickedForSpam: { type: Date, default: new Date() },

    spamAlertStartDate: { type: Date },

    spamAlertEndDate: { type: Date }
}, {
    timestamps: true
})

const warmUserSettings = model("warmupusersettings", warmUserSettingsSchema)

module.exports = warmUserSettings;



// first we have 2 crons 
// one is activating the spam alert if spam rate found 15% or above
// once any provider spam alert activated then warmUpSetting reset cron will update the limit to 150 of that provider.
// warmqueue will create the new warmup emails with the current limit and while sending we need to update the reply rate wrt 100%
