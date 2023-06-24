const { activateSpamAlert, deactivateSpamAlert } = require("../controllers/warmupEmailLogs.controller")

module.exports = {
    ActivateSpamAlert: () => {
        activateSpamAlert()
    },
    DeactivateSpamAlert: () => {
        deactivateSpamAlert()
    }
}