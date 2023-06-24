const { createLogger, format, transports } = require("winston");


const logger = createLogger({
    transports: [
        new transports.Console(),
    ],
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.json(),
        format.simple(),
    )
})

module.exports = {
    logger
}