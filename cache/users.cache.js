const { setData, getData } = require("./index");

const setWarmEnabledUserCache = async (userData) => {
    await setData(_warm_enabled_users, JSON.stringify(userData))
}

const getWarmEnabledUserCache = async () => {
    let isDataExist = await getData(_warm_enabled_users);

    isDataExist = JSON.parse(isDataExist);
    return isDataExist;
}

module.exports = {
    setWarmEnabledUserCache,
    getWarmEnabledUserCache
}