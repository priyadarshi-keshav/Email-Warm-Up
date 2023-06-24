const { setData, getData } = require("./index");

const setSMTPCache = async (userId, smtpData) => {
    let isExist = await getData(userId);
    let data

    if (isExist) {
        isExist = JSON.parse(isExist);
        data = {
            ...isExist,
            smtp: smtpData
        }

        await setData(userId, JSON.stringify(data))

    } else {
        data = { smtp: smtpData }
        await setData(userId, JSON.stringify(data))
    }
}

const getSMTPCache = async (userId) => {
    let isExist = await getData(userId);
    isExist = JSON.parse(isExist);

    if (isExist && isExist.smtp) {
        return isExist.smtp
    }

    return;
}

module.exports = {
    setSMTPCache,
    getSMTPCache
}