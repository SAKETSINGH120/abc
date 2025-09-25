const multer = require("multer");
const fs = require("fs");
const path = require("path");

const fileUploader = (folderName, fields) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join("public", folderName);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname) || ".jpeg";
      const fileName = `${folderName}-${Date.now()}-${Math.round(
        Math.random() * 1e4
      )}${ext}`;
      cb(null, fileName);
    },
  });

  return multer({ storage }).fields(fields);
};

module.exports = fileUploader;
