const handlebars = require("handlebars");

const handlebarCompiler = (message, value) => {

    const data = handlebars.compile(message)(value);
    return data;
};

module.exports = { handlebarCompiler };