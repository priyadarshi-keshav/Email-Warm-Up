const { writeLoggerFile } = require("./logger.helper");
const Spinner = require("node-spintax/Spinner");

//funtion to add {{}} for handlebars
const AddHandlebarBrackets = (item, toBeBracketWords) => {
  if (toBeBracketWords && item) {
    let response = item;

    for (let idx of toBeBracketWords) {
      const reg = new RegExp(`${idx}`, "g");
      response = response?.replace(reg, `{{${idx}}}`);
    }
    return response;
  } else return item;
};
//function to remove  duplicates elements
const removeDuplicatesElements = (arr) => {
  return arr?.filter((item, index) => arr?.indexOf(item) === index);
};
//funtion to remove extra spacing
const RemoveExtraSpacing = (item, removeExtraSpace) => {
  if ((item, removeExtraSpace)) {
    let response = item;

    for (let idx of removeExtraSpace) {
      const objectWithRemovedspaces = idx.split("|")?.map(idx => idx?.trim())
      response = response?.replace(idx, objectWithRemovedspaces.join("|"));
    }
    return response;
  } else return item;
};

const Spintax = (body, templateId) => {
  try {
    if (body) {
      const FindAllHandleBarData =
        body?.match(/{{(.*?)}}/g)?.length > 0
          ? removeDuplicatesElements(body?.match(/{{(.*?)}}/g)?.map((item) => {
            let removeBracket = item.split("{{");
            removeBracket = removeBracket[1].split("}}");
            return removeBracket[0];
          }))
          : [];
      const findAllSpintax =
        body?.match(/{(.*?)}/g)?.length > 0
          ? body?.match(/{(.*?)}/g)?.filter((item) => {
            if (item?.includes("|")) {
              return item;
            }
          })
          : [];
      // Creates new instance of Spinner with specified spintax-string.
      var spinner = new Spinner(
        findAllSpintax?.length > 0
          ? RemoveExtraSpacing(body, findAllSpintax)
          : body
      );

      let randomUniqueVariations = spinner.unspinRandom(true);
      randomUniqueVariations = randomUniqueVariations[0]?.replace(
        /\n/g,
        "<br/>"
      );
      randomUniqueVariations =
        FindAllHandleBarData?.length > 0
          ? AddHandlebarBrackets(randomUniqueVariations, FindAllHandleBarData)
          : randomUniqueVariations;

      return randomUniqueVariations;
    }
    else return "";
  } catch (error) {
    writeLoggerFile({
      logType: "Spintex funtion.",
      templateId,
      templateBody: body,
      error: error.message,
      timeStamp: new Date(),
    });
  }
};

module.exports = { Spintax };
