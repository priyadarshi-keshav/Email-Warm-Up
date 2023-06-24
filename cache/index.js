const { createClient } = require("redis");
const REDIS_PORT = process.env.REDIS_PORT || 6379
const REDIS_HOST_NAME = process.env.REDIS_HOST_NAME || "127.0.0.1"
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ""

const client = createClient({
    socket: {
        host: REDIS_HOST_NAME,
        port: REDIS_PORT
    },
    password: REDIS_PASSWORD
});

const connectRedis = () => {
    return new Promise((resolve, reject) => {

        client.on("error", err => {
            reject(err);
        });

        client.connect().then(() => {
            resolve(`Redis DB connected on HOST: ${REDIS_HOST_NAME} PORT: ${REDIS_PORT}`);
        });
    });
};

const setData = async (key, value, exp) => {
    const data = await client.set(key, value, { EX: exp ? exp : 3600 })
    return data;
};

const getData = async (key) => {
    return await client.get(key)
};

// get all keys
const getAllKeys = async () => {
    return await client.keys("*")
}

// push data to an array
const pushData = async (key, value, exp) => {
    const stringifyObj = JSON.stringify(value);
    const data = await client.RPUSH(key, stringifyObj, { EX: 1 * 24 * 60 * 60 })
    return data;
};

// get data from an array
const getListData = async (key, start, stop) => {
    const data = await client.lRange(key, start, stop);
    const listLength = await client.lLen(key);
  
    if (data) {
        return {
            size: listLength,
            logs: data.map(ele => JSON.parse(ele))
        };
    } else {
        return null;
    }
};

const getSetData = async (key) => {
    const users = await client.sMembers(key)
    return users;
}

const deleteData = async (key) => {
    const data = await client.del(key);
    return data;
}


module.exports = {
    connectRedis,
    getData,
    setData,
    getAllKeys,
    pushData,
    getListData,
    deleteData,
    getSetData,
    client
};