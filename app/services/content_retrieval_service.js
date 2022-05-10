const fs = require('fs')

exports.getContent = async (fileName) => {
  let filePath = "config/content/" + fileName

  console.log("retrieving file: " + filePath);

  const markdownPromise = new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.log("error: " + err);
        reject("")
      }
      console.log("returning data: " + data)
      resolve(data)
    })
  });

  return markdownPromise

}
