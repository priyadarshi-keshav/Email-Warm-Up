const userModel = require("../models/user.schema");

const getUserEmail = async (userId) => {
    try {
        const data = await userModel.findById(userId).select("email");
        return data.email;
    } catch (error) {

    }
}

module.exports = {
    getUserEmail
}