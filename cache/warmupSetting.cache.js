const { setData, getData } = require("./index");

const setWarmupSettingCache = async (userId, userData) => {
    let isExist = await getData(userId);
    let data

    if (isExist) {
        isExist = JSON.parse(isExist);
        data = {
            ...isExist,
            omniWarmSettings: userData
        }

        await setData(userId, JSON.stringify(data))

    } else {
        data = { user: userData }
        await setData(userId, JSON.stringify(data))
    }
}

const getWarmupSettingCache = async (userId) => {
    let isExist = await getData(userId);
    isExist = JSON.parse(isExist);

    if (isExist && isExist.omniWarmSettings) {
        return isExist.omniWarmSettings
    }

    return;
}

module.exports = {
    setWarmupSettingCache,
    getWarmupSettingCache
}