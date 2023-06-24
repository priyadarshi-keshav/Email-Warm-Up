const { Schema, model } = require('mongoose')

const UserSchema = new Schema({

    parentId: { type: String, required: true },

    firstName: { type: String, required: true },

    lastName: { type: String, required: false },

    email: { type: String, required: true, unique: true },

    mobile: { type: String, required: false },

    password: { type: String, required: true },

    role: { type: Number, required: true, default: 2 },

    roleName: { type: String, required: true, default: 'client-admin' },

    profileImage: { type: String, required: false, default: null },

    isActive: { type: Boolean, required: true, default: false },
    emailVerified: { type: Boolean, default: false },
    planExpired: { type: Boolean, default: false },
    softDelete: { type: Boolean, default: false },
    campaignCreated: { type: Boolean, default: false },
    campaignSent: { type: Boolean, default: false },

    gdpr: { type: Boolean, default: false },

    registrationDate: { type: Date, default: new Date() },

    expirationDate: { type: Date },

    confirmToken: { type: String, required: false },

    refreshToken: { type: String, required: false },

    planType: { type: String, enum: ['trial', 'paid'] },

    plan: { type: String, enum: ['monthly', 'yearly'] },

    paid: { type: Boolean, required: true, default: false },

    passwordChanged: { type: Boolean, required: false, default: false },

    emailProvider: { type: String, enum: ['gmail', 'smtp'], required: false, default: null },

    textProvider: { type: String, enum: ['twilio'], required: false, default: null },

    tested: { type: Boolean, required: false, default: false },

    smtpTested: { type: Boolean, required: false, default: false },
    
}, {
    timestamps: true
})

const User = model('user', UserSchema)

module.exports = User;