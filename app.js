const express = require('express');
const multer = require('multer');
const moment = require('moment');
const AdmZip = require('adm-zip');

const app = express();
const zip = new AdmZip();
const upload = multer();

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log(
    `Method: '${req.method}', URL: ${req.originalUrl}, Body: ${JSON.stringify(
      req.body,
    )}`,
  );
  next();
});

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.post('/upload', upload.single('upload-pdf'), (req, res) => {
  console.log('submitted!', req.file, JSON.stringify(req.body));
  zip.addFile(req.file.originalname, req.file.buffer);
  zip.addFile(
    'options.txt',
    `Transition=${req.body.transition}\nAdvance=${req.body.interval}`,
  );
  zip.writeZip(
    `./archives/sign${req.body.signNumber}/${moment().format(
      'YYYYMMDDhhmmss',
    )}.zip`,
  );
  res.sendStatus(200);
});

app.use((err, req, res, next) => {
  const { statusCode, status } = err;
  res.status(statusCode || 500).json({
    status: status || 'error',
    message: err.message,
  });
});

module.exports = app;
