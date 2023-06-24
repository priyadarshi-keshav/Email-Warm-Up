const { Schema, model } = require("mongoose");

const warmEmailTemplateSchema = new Schema({
    emailThreads: [{
        _id: { type: String },
        threadOrder: { type: Number },
        mailSubject: { type: String },
        mailBody: { type: String },
    }]
}, {
    timestamps: true
});

const warmEmailTemplate = model("warmupemailtemplates", warmEmailTemplateSchema);

module.exports = warmEmailTemplate;