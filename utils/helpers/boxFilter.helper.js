exports.boxFilter = (provider) => {
    if (provider === "gmail") {
      return "[Gmail]/Spam"
    } else if (provider === "yahoo") {
      return "Bulk"
    } else if (provider === "outlook") {
      return "Junk"
    }
  }
  