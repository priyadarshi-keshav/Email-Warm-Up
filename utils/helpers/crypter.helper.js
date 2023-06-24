const Cryptr = require("cryptr")

module.exports.decrypted = async (key, encryptedString) => {
      let cryptr = new Cryptr(key)
      return cryptr.decrypt(encryptedString);
};