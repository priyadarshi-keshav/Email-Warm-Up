require('dotenv').config();
const express = require("express");
const { MONGO_URI } = require("./config/config");
const PORT = process.env.PORT || 3000;
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require('node-cron');
const { getLoggerFile, writeLoggerFile, deleteLogger } = require('./utils/helpers/logger.helper');
const { routeNotFound } = require("./utils/handlers/routeNotFound.handler")
const { errorHandler } = require("./utils/handlers/error.handler")
const { logger } = require("./logger")

// middlewares
app.use(cors());
app.use(express.json());

const numeral = require("numeral");
const { connectRedis } = require("./cache/index");
const { CreateWarmupQueue } = require('./cron-jobs/createWarmupQueue');
const { SendWarmupEmails } = require('./cron-jobs/sendWarmupEmails');
const { CreateWarmupReplyQueue } = require('./cron-jobs/createWarmupReplyQueue');
const { ResetWarmupSettings } = require('./cron-jobs/resetWarmupSettings');
const { ActivateSpamAlert, DeactivateSpamAlert } = require('./cron-jobs/spamAlertActivity');
const { arenaConfig } = require('./queues/queueDashboard');
const { GetSetData, DeleteData, GetAllKeys, GetData } = require("./controllers/redis.controller");
const { queueResetToPending } = require('./controllers/warmupEmailQueue.controller');
const { removeQueueJobs } = require('./controllers/jobs.controller');
const { ReplyWarmupEmails } = require('./cron-jobs/replyWarmupEmails');
const { moveMessagesToOmniwarmLabelImap } = require('./cron-jobs/moveMessageToLabel');
const { ResetSMTPproviders } = require('./cron-jobs/resetSMTPproviders');


//databse connection
mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        readPreference: "secondaryPreferred"
    })
    .then(async () => {
        logger.info(`Mongo DB Connected ${MONGO_URI}`)
        // added this reset function to reset all SENDING queue to make it PENDING.
        await queueResetToPending();
    })
    .catch(err => logger.error(err.message));


// mongoose.set('debug', true)

// cache connection
connectRedis()
    .then(data => {
        const message = {
            "status": 200,
            "logType": "Redis Connection",
            "message": data,
            "timestamp": new Date()
        };
        logger.info(message)
        writeLoggerFile(message)
    })
    .catch(err => {
        const message = {
            "status": 500,
            "logType": "Redis Connection",
            "message": `${err.message}`,
            "timestamp": new Date()
        }
        logger.error(message)
        writeLoggerFile(message)
    })

// running cron at every 5th minute of an hour.
cron.schedule("*/5 * * * *", async () => {
    await CreateWarmupQueue()
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron at every one minute.
cron.schedule("*/1 * * * *", async () => {
    await SendWarmupEmails()
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron at every one minute.
cron.schedule("*/1 * * * *", async () => {
    await ReplyWarmupEmails()
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron at every minute.
cron.schedule("*/1 * * * *", async () => {
    await CreateWarmupReplyQueue({
        spamAlert: false
    })
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron at every minute.
cron.schedule("*/1 * * * *", async () => {
    await CreateWarmupReplyQueue({
        spamAlert: true
    })
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron at every midnight at 0 0 * * *.
cron.schedule("0 0 * * *", async () => {
    await ResetWarmupSettings()
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron everyday at */28 * * * * = 23:50:00 UTC.
cron.schedule("*/28 * * * *", () => {
    ActivateSpamAlert()
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron everyday at */29 * * * *.
cron.schedule("*/29 * * * *", () => {
    DeactivateSpamAlert()
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron at the interval of */5 * * * *.
cron.schedule("*/5 * * * *", () => {
    moveMessagesToOmniwarmLabelImap()
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// running cron at every midnight at 0 0 * * *.
cron.schedule("0 0 * * *", async () => {
    await ResetSMTPproviders()
}, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "UTC"
});

// endpoints
app.get("/", (req, res, next) => {
    try {
        res.status(200).json({
            status: 200,
            serverName: "Omni warm-up emails",
            message: `Server is running on port ${PORT}`
        })
    } catch (error) {
        next(error)
    }
})

app.get("/warmup-emails/logs/:date", async (req, res, next) => {
    try {
        const { date } = req.params;
        const { start, stop } = req.query;
        const response = await getLoggerFile(
            date,
            start ? start : 0,
            stop ? stop : -1
        )
        if (response) {
            res.send(response);
        } else {
            next(`No logs found for the given date: ${date}`)
        }
    } catch (error) {
        next(error)
    }
});

app.delete("/warmup-emails/logs/:date", async (req, res, next) => {
    try {
        const { date } = req.params;
        const response = await deleteLogger(date)
        if (response) {
            res.send({
                message: `Logs for date ${date} is deleted.`
            });
        } else {
            next(`No logs found for the given date: ${date}`)
        }
    } catch (error) {
        next(error)
    }
});

app.get('/redis/all-key', GetAllKeys)
app.get('/redis/set-data/:key', GetSetData)
app.get('/redis/:key', GetData)
app.delete('/redis/:key', DeleteData)

app.post("/remove-jobs", removeQueueJobs);

app.get('/memory-stats', async (req, res, next) => {
    try {
        const { rss, heapTotal, heapUsed } = process.memoryUsage()
        res.send({
            rss: numeral(rss).format("0.0 ib"),
            heapTotal: numeral(heapTotal).format("0.0 ib"),
            heapUsed: numeral(heapUsed).format("0.0 ib")
        })
    } catch (error) {
        next(error)
    }
})
app.post("/remove-jobs", removeQueueJobs);

// middlewares
app.use('/queue-dashboard', arenaConfig);
app.use(routeNotFound)
app.use(errorHandler)

// setInterval(() => {
//     const { rss, heapTotal, heapUsed } = process.memoryUsage()
//     console.log("rss: ", numeral(rss).format("0.0 ib"), "heapTotal: ", numeral(heapTotal).format("0.0 ib"), "heapUsed: ", numeral(heapUsed).format("0.0 ib"))
// }, 20000);

app.listen(PORT, async () => {
    console.log(`Server is 🏃 on port ${PORT}`);
});