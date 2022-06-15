const fs = require('fs')

exports.getContent = async (fileName) => {
  let filePath = "config/content/" + fileName

  const markdownPromise = new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.log("error: " + err);
        reject("")
      }
      resolve(data)
    })
  });

  return markdownPromise

}
