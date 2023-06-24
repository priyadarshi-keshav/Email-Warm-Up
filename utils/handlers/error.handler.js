const { logger } = require("../../logger");

module.exports = {
    errorHandler: (error, req, res, next) => {
        res.status(error.status || 500).send({
            status: error.status || 500,
            message: error.message ? error.message : "Something went wrong"
        })
        
        logger.error({
            status: error.status || 500,
            message: error.message ? error.message : "Something went wrong"
        })
    }
}
