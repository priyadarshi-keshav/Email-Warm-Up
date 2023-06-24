const { Types } = require("mongoose");
const warmupEmailLogsModel = require("../models/warmupEmailLogs.schema");
const warmupSettingsModel = require("../models/warmupSettings.schema");
const warmupEmailQueueModel = require("../models/warmupEmailQueue.schema");
const { writeLoggerFile } = require("../utils/helpers/logger.helper");
const moment = require("moment");

module.exports = {

  createWarmupEmailLogs: async (warmupQueueData, response, sendStatus) => {
    try {
      const {
        userId,
        parentId,
        emailTemplateId,
        threadId,
        threadOrder,
        isLastThreadOrder,
        senderProviderId,
        receiverProviderId,
        mailSubject,
        mailBody,
        // emailProvider,
        isRepliedLog,
        repliedToMessageId,
        roomId,
      } = warmupQueueData;

      const logBody = {
        userId,
        parentId,
        emailTemplateId,
        threadId,
        threadOrder,
        isLastThreadOrder,
        senderProviderId,
        receiverProviderId,
        mailSubject,
        mailBody,
        // emailProvider,
        folderStatus: "INBOX",
        isRepliedLog,
        repliedToMessageId: repliedToMessageId ? repliedToMessageId : null,

        roomId,
        label: process.env.LABEL_NAME,
        event: response ? "DELIVERED" : null,
        eventLogs: response
          ? [
            {
              eventStatus: "DELIVERED",
              timeStamp: new Date(),
            },
          ]
          : [],
        response,
        sendStatus,
      };

      await warmupEmailLogsModel.create(logBody);
      return;
    } catch (error) {
      writeLoggerFile({
        logType: "Email logs controller createWarmupEmailLogs.",
        error: error.message,
        timeStamp: new Date(),
      });
    }
  },

  updateReplyEventInWarmupEmailLogs: async (
    roomId,
    senderProviderId,
    receiverProviderId,
    emailTemplateId,
    threadOrder
  ) => {
    try {
      await warmupEmailLogsModel.findOneAndUpdate(
        {
          roomId,
          emailTemplateId,
          threadOrder,
          senderProviderId: new Types.ObjectId(receiverProviderId),
          receiverProviderId: new Types.ObjectId(senderProviderId),
        },
        {
          event: "REPLIED",
          $push: {
            eventLogs: {
              eventStatus: "REPLIED",
              timestamp: new Date(),
            },
          },
        },
        { new: true }
      );
    } catch (error) {
      writeLoggerFile({
        status: error.status,
        logType: "Email logs controller updateReplyEventInWarmupEmailLogs.",
        error: error.message,
        timeStamp: new Date(),
      });
    }
  },

  getTotalSentAndReplyCount: async (userId, providerId) => {
    try {
      const promiseData = await Promise.all([
        warmupEmailLogsModel.count({
          userId: new Types.ObjectId(userId),
          senderProviderId: new Types.ObjectId(providerId),
          sendStatus: "COMPLETED",
          "eventLogs.eventStatus": "DELIVERED"
        }),
        warmupEmailLogsModel.count({
          userId: new Types.ObjectId(userId),
          senderProviderId: new Types.ObjectId(providerId),
          sendStatus: "COMPLETED",
          "eventLogs.eventStatus": "REPLIED"
        })
      ])

      const totalSent = promiseData[0];
      const totalReplied = promiseData[1];

      return {
        sentCount: totalSent ? totalSent : 0,
        repliedCount: totalReplied ? totalReplied : 0,
      };

    } catch (error) {
      writeLoggerFile({
        status: error.status,
        logType: `Email logs controller getTotalSentAndReplyCount.`,
        error: error.message,
        timestamp: new Date()
      })
    }
  },

  // here we need to check for SPAM deliverability so that we can update the limit and reply rate accordingly
  // update the field spamAlertActive in warmUpUserSettings as true if 
  // `
  //   If daily warmup limit is more than 40 and the spam rate is 15% for past 2 consecutive days, then
  //   Daily warmup limit = 150
  //   Omniwarm limit becomes negligible
  //   Reply rate = 100 %
  //   Continue the above configuration until 100% of emails land in inbox for 3 days consecutively, then
  //   Omniwarm limit = 50
  //   Reply rate = 60 %
  //   Daily warmup limit = 50
  // `
  activateSpamAlert: async () => {
    try {
      // start function at 2023-04-26T02:54:17.936Z
      // end function at 2023-04-26T02:55:16.059Z

      let pastDate = moment().subtract(2, "days").utc().format();
      let yesterday = moment().subtract(1, "days").utc().format();
      let today = moment().utc().format();
      let tomorrow = moment().add(1, "days").utc().format("YYYY-MM-DD");

      // below query takes 245 ms to complete as per Explain in Compass
      const warmupUsers = await warmupSettingsModel.aggregate([
        {
          $match: {
            limit: { $gt: 40 },
            spamAlertActive: false,
            lastPickedForSpam: {
              $gte: yesterday,
              $lt: today
            }
          }
        },
        {
          $lookup: {
            from: "smtps",
            localField: "providerId",
            foreignField: "_id",
            as: "providerData"
          }
        },
        {
          $match: {
            "providerData.isDisconnected": false,
            "providerData.isWarmupActive": true
          }
        },
        {
          $limit: 100
        }
      ]);

      // lets update the lastPickedForSpam to achieve batching
      await warmupSettingsModel.updateMany(
        {
          _id: { $in: warmupUsers.map(item => item._id) }
        },
        {
          lastPickedForSpam: new Date()
        }
      )

      for (let warmupUser of warmupUsers) {
        // below query takes 4-5 ms to complete as per Explain in Compass
        const data = await Promise.all([
          warmupEmailLogsModel.count({
            senderProviderId: new Types.ObjectId(warmupUser.providerId),
            createdAt: {
              $gte: pastDate,
              $lt: today
            },
            "eventLogs.eventStatus": "DELIVERED"
          }),

          warmupEmailLogsModel.count({
            senderProviderId: new Types.ObjectId(warmupUser.providerId),
            createdAt: {
              $gte: pastDate,
              $lt: today
            },
            folderStatus: "SPAM"
          })

        ])

        let deliveredCount = data[0]
        let spamCount = data[1]

        // calculate the SPAM deliverability rate
        const spamRate = Math.round((spamCount / deliveredCount) * 100);

        if (spamRate >= 15) {
          // we delete all the queue for next day because we mark setting pickForTheDay: false to make the fresh queue wrt new spam limit 150
          // we always make the queue for next day

          Promise.all([
            warmupEmailQueueModel.deleteMany({
              sendCronDate: tomorrow
            }),

            warmupSettingsModel.updateOne(
              {
                userId: new Types.ObjectId(warmupUser.userId),
                providerId: warmupUser.providerId
              },
              {
                limit: process.env.SPAM_WARMUP_LIMIT,
                pickedForTheDay: false,
                spamAlertActive: true,
                spamAlertStartDate: new Date(tomorrow)
              }
            ),
          ])
        }
      }

      return;

    } catch (error) {
      writeLoggerFile({
        status: error.status,
        logType: `Email logs controller activateSpamAlert.`,
        error: error.message,
        timestamp: new Date()
      })
    }
  },

  // deactivating spam alert
  deactivateSpamAlert: async () => {
    try {
      let pastDate = moment().subtract(3, "days").utc().format();
      let yesterday = moment().subtract(1, "days").utc().format();
      let today = moment().utc().format();
      // today = 2023-04-30
      // pastDate = 2023-04-27
      // yesterday = 2023-04-29
      // spam alert runs on 27, 28, and 29 which is 3 consecutive days
      // Hence, actual spamAlertStartDate = 2023-04-27 and 
      // actual spamAlertEndDate = 2023-04-29 

      const warmupUsers = await warmupSettingsModel.aggregate([
        {
          $match: {
            spamAlertActive: true,
            spamAlertStartDate: { $lte: pastDate },
            lastPickedForSpam: {
              $gte: yesterday,
              $lt: today
            }
          }
        },
        {
          $lookup: {
            from: "smtps",
            localField: "providerId",
            foreignField: "_id",
            as: "providerData"
          }
        },
        {
          $match: {
            "providerData.isDisconnected": false,
            "providerData.isWarmupActive": true
          }
        }
      ]);

      // lets update the lastPickedForSpam to achieve batching
      await warmupSettingsModel.updateMany(
        {
          _id: { $in: warmupUsers.map(item => item._id) }
        },
        {
          lastPickedForSpam: new Date()
        }
      )

      for (let warmupUser of warmupUsers) {

        const data = await Promise.all([
          warmupEmailLogsModel.count({
            senderProviderId: new Types.ObjectId(warmupUser.providerId),
            createdAt: {
              $gte: pastDate,
              $lt: yesterday
            },
            "eventLogs.eventStatus": "DELIVERED"
          }),

          warmupEmailLogsModel.count({
            senderProviderId: new Types.ObjectId(warmupUser.providerId),
            createdAt: {
              $gte: pastDate,
              $lt: yesterday
            },
            folderStatus: "SPAM"
          })

        ])

        let deliveredCount = data[0]
        let spamCount = data[1]

        console.log({ provider: warmupUser.providerId, deliveredCount, spamCount })

        // calculate the SPAM deliverability rate
        const spamRate = Math.round((spamCount / deliveredCount) * 100);

        if (spamRate === 0) {
          await warmupSettingsModel.updateOne(
            {
              userId: warmupUser.userId,
              providerId: new Types.ObjectId(warmupUser.providerId)
            },
            {
              limit: process.env.DAILY_WARMUP_LIMIT,
              spamAlertActive: false,
              spamAlertEndDate: new Date(yesterday)
            }
          )
        }
      }

      return;

    } catch (error) {
      writeLoggerFile({
        status: error.status,
        logType: `Email logs controller deactivateSpamAlert.`,
        error: error.message,
        timestamp: new Date()
      })
    }
  },

  deleteWarmEmailLogs: async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const warmupLogsDeletedResponse = await warmupSettingsModel.deleteMany({
        createdAt: {
          $lt: thirtyDaysAgo
        }
      });

      return warmupLogsDeletedResponse;

    } catch (error) {
      writeLoggerFile({
        status: error.status,
        logType: `Email logs controller deleteWarmEmailLogs.`,
        error: error.message,
        timestamp: new Date()
      })
    }
  }
};
