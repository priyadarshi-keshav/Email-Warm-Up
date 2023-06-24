const moment = require("moment")

const timeZoneConverter = (timezone) => {
    let offSet = timezone.split("UTC")[1]
    const cTime = moment().utcOffset(offSet).format("HH:mm:ss");
    return cTime;
}

const timeZoneDayConverter = (timezone) => {
    let offSet = timezone.split("UTC")[1]
    const cWeekDay = moment().utcOffset(offSet).format("d");
    return cWeekDay;
}

module.exports = { 
    timeZoneConverter ,
    timeZoneDayConverter
};