const express = require('express');
const path = require('path');
const multer = require('multer');
const moment = require('moment');
const AdmZip = require('adm-zip');
const basicAuth = require('express-basic-auth');
const pdf = require('pdf-thumbnail');
const fs = require('fs');
const credentials = require('./credentials.json');

const app = express();
const zip = new AdmZip();
const upload = multer();
const NUMBER_OF_SIGNS = 3;

const getMostRecentSignTimestamp = signNumber => {
  return new Promise((resolve, reject) => {
    fs.readdir(`./archives/sign${signNumber}`, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(Math.max(...files.map(file => file.split('.')[0])));
      }
    });
  });
};

const generateThumbnail = async (buffer, signNumber) => {
  await pdf(buffer)
    .then(data =>
      data.pipe(
        fs.createWriteStream(`./public/thumbnails/${signNumber}-thumb.jpg`),
      ),
    )
};

app.get('/', basicAuth({ challenge: true, users: credentials }));
app.get('/', async (req, res, next) => {
  //await generateAllThumbnails().catch(error => next(error));
  next();
});

app.use(express.static('public'));
app.use(express.json());

app.post('/upload', upload.single('upload-pdf'), async (req, res) => {
  if (req.file.mimetype !== 'application/pdf') {
    throw new Error('Uploaded file must be a PDF');
  }

  await generateThumbnail(req.file.buffer, req.body.signNumber);
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

  res.sendStatus(204);
});

app.get('/update', async (req, res, next) => {
  const { sign, timestamp } = req.query;

  if (sign < 1 || sign > NUMBER_OF_SIGNS) {
    res
      .status(400)
      .send(`sign must be an integer from 1 to ${NUMBER_OF_SIGNS}`);
    next();
  }

  const currentSignArchiveTimestamp = await getMostRecentSignTimestamp(
    sign,
  ).catch(error => {
    next(error);
  });

  if (currentSignArchiveTimestamp > timestamp) {
    res.download(`./archives/sign${sign}/${currentSignArchiveTimestamp}.zip`);
  } else {
    res.sendStatus(304);
  }
});

app.use((err, req, res, next) => {
  const { statusCode, status } = err;
  res.status(statusCode || 500).send({
    status: status || 'error',
    message: err.message,
  });
});

module.exports = app;
