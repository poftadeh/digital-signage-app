const express = require('express');
const multer = require('multer');
const moment = require('moment');
const AdmZip = require('adm-zip');
const fs = require('fs').promises;

const app = express();
const zip = new AdmZip();
const upload = multer();
const { basicAuthCredentials, updatePassword } = require('./config');

const getMostRecentSignTimestamp = async signNumber => {
  const files = await fs.readdir(`./archives/sign${signNumber}`);
  return Math.max(...files.map(file => file.split('.')[0]));
};

app.use(express.json());
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
  res.end();
});

app.get('/update', async (req, res, next) => {
  const { password, signnumber, timestamp } = req.query;

  if (password !== updatePassword) {
    res.status(401).send('Password is invalid.');
    next();
  }

  if (signnumber < 1 || signnumber > 3) {
    res.status(400).send('sign must be an integer from 1 to 3');
    next();
  }

  const currentSignArchiveTimestamp = await getMostRecentSignTimestamp(
    signnumber,
  ).catch(error => {
    next(error);
  });

  if (currentSignArchiveTimestamp > timestamp) {
    res.download(`./archives/sign${signnumber}/${currentSignArchiveTimestamp}.zip`);
  } else {
    res.sendStatus(304);
  }
});

app.use((err, req, res, next) => {
  const { statusCode, status } = err;
  res.status(statusCode || 500).json({
    status: status || 'error',
    message: err.message,
  });
});

module.exports = app;
