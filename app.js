const express = require('express');
const multer = require('multer');
const moment = require('moment');
const AdmZip = require('adm-zip');
const basicAuth = require('express-basic-auth');
const pdf = require('pdf-thumbnail');
const fs = require('fs');

const app = express();
const zip = new AdmZip();
const upload = multer();
const { basicAuthCredentials, updatePassword } = require('./config');
const NUMBER_OF_SIGNS = 3;

const getMostRecentSignTimestamp = signNumber => {
  return new Promise((resolve, reject) => {
    fs.readdir(`./archives/sign${signNumber}`, (err, files) => {
      if (err) reject(err);
      resolve(Math.max(...files.map(file => file.split('.')[0])));
    });
  });
};

const generateThumbnail = (pathToPdf, signNumber) => {
  return pdf(fs.readFileSync(pathToPdf))
    .then(data =>
      data.pipe(
        fs.createWriteStream(`./public/thumbnails/${signNumber}-thumb.jpg`),
      ),
    )
    .catch(err => console.error(err));
};

const generateAllThumbnails = async () => {
  for (let signNumber = 1; signNumber <= NUMBER_OF_SIGNS; signNumber++) {
    try {
      const timestamp = await getMostRecentSignTimestamp(signNumber);
      await generateThumbnail(`./archives/sign${signNumber}/${timestamp}.zip`);
    } catch (e) {
      console.log(e);
      fs.copyFileSync(
        './public/thumbnails/default.jpg',
        `./public/thumbnails/${signNumber}-thumb.jpg`,
      );
    }
  }
};

app.use(basicAuth({ challenge: true, users: basicAuthCredentials }));

app.use(express.json());

app.get('/', async (req, res) => {
  await generateAllThumbnails();
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

  if (signnumber < 1 || signnumber > NUMBER_OF_SIGNS) {
    res.status(400).send('sign must be an integer from 1 to 3');
    next();
  }

  const currentSignArchiveTimestamp = await getMostRecentSignTimestamp(
    signnumber,
  ).catch(error => {
    next(error);
  });

  if (currentSignArchiveTimestamp > timestamp) {
    res.download(
      `./archives/sign${signnumber}/${currentSignArchiveTimestamp}.zip`,
    );
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
