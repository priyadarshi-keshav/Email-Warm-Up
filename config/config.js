const { NODE_ENV } = process.env;

const MONGO_USERNAME = process.env.MONGO_USERNAME
const MONGO_PASSWORD = process.env.MONGO_PASSWORD
const MONGO_DB_NAME = process.env.MONGO_DB_NAME
const MONGO_DB_HOST = process.env.MONGO_DB_HOST

exports.MONGO_URI = NODE_ENV
  ? `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_DB_HOST}/${MONGO_DB_NAME}?retryWrites=true&w=majority`
  : `mongodb://127.0.0.1:27017/OmniDb`;