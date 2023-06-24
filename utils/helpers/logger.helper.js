// const fs = require("fs");
// const loggerDirectory = `logger`;


// async function writeLoggerFile(message) {
//   let fileName = `${new Date().toISOString().split("T")[0]}.json`;
//   let filePath = `${loggerDirectory}/${fileName}`;

//   if (!fs.existsSync(filePath)) {
//     fs.writeFileSync(filePath, "", "utf-8");
//   }
//   let Data = fs.readFileSync(filePath, "utf-8");
//   let fileContents = [];
//   if (Data) {
//     fileContents = JSON.parse(Data);
//   }
//   fileContents.push(message);
//   fs.writeFileSync(filePath, JSON.stringify(fileContents, null, 2));
// }


// async function deleteLoggerFile(date) {
//   let filePath = `${loggerDirectory}/${date}.json`

//   if (!fs.existsSync(filePath)) {
//     return
//     // fs.writeFileSync(filePath, "", "utf-8");
//   }

//   fs.readFileSync(filePath, "utf-8");
//   let fileContents = [];
//   fs.writeFileSync(filePath, JSON.stringify(fileContents, null, 2));
//   return fileContents
// }

const { pushData, getListData, deleteData } = require("../../cache")
const { logger } = require("../../logger");

// key pattern for logs 
// OWEMAIL_YYY-MM-DD = Done (Dev testing)
// OWIMAP_YYY-MM-DD = Done (need to add env on server)
// OOIMAP_YYY-MM-DD = Done
// OOEMAIL_YYY-MM-DD = Done
// OOSMS_YYY-MM-DD
// OCRON_YYY-MM-DD = Done

const keyPrefix = "OWEMAIL_";

const writeLoggerFile = async (logMessage) => {
  // we are only logging errors in console not any info
  if (typeof logMessage === "object" && "error" in logMessage) {
    logger.error(JSON.stringify(logMessage));
  }

  const keySuffix = new Date().toISOString().split("T")[0];
  await pushData(`${keyPrefix}${keySuffix}`, logMessage);
  return;
}

const getLoggerFile = async (date, start, stop) => {
  const data = await getListData(
    `${keyPrefix}${date}`, start, stop
  );
  return data;
}

const deleteLogger = async (date) => {
  return await deleteData(`${keyPrefix}${date}`)
}

module.exports = {
  writeLoggerFile,
  getLoggerFile,
  deleteLogger
}