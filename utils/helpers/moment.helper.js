const moment = require("moment");

const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
};

const getMinutes = () => {
    const start = 11;
    const end = process.env.NODE_ENV == "PRODUCTION" ? 2880 : 300;
    return getRandomNumber(start, end)
};

const getTime = () => {
    const startHour = 1;
    const endHour = 20;
    const startMinute = 1;
    const endMinute = 59;

    let hour = getRandomNumber(startHour, endHour)
    hour = hour < 10 ? `0${hour}` : hour

    let minute = getRandomNumber(startMinute, endMinute)
    minute = minute < 10 ? `0${minute}` : minute

    let time = `${hour}:${minute}:00`
    return time;
};

const getUTCAddedTime = (minute) => {
    const addedMin = moment().add(minute, "minutes").utc()
    const date = addedMin.format("YYYY-MM-DD");
    const time = addedMin.format("HH:mm:ss");

    return {
        date,
        time: time > "21:00:00" ? "21:00:00" : time
    };
};

const getUTCCurrentTime = () => {
    const currentTime = moment().utc();
    const date = currentTime.format("YYYY-MM-DD");
    const time = currentTime.format("HH:mm:ss");

    return {
        date,
        time
    };
};

module.exports = {
    getTime,
    getMinutes,
    getUTCAddedTime,
    getUTCCurrentTime
};