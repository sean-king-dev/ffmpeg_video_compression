const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }, // Adjust as needed
}).single('video');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle file upload and compression
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send('Error uploading file');
    } else {
      const inputFilePath = `./uploads/${req.file.originalname}`;
      const outputDirectory = './compressed/';
      const outputFilePath = `${outputDirectory}${req.file.originalname}`;

      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
      }

      // Access compression percentage from request body
      const compressionPercentage = req.body.compressionPercentage;

      // Command to compress using FFmpeg
      const ffmpegCommand = `ffmpeg -i "${inputFilePath}" -vf "scale=iw*${compressionPercentage}/100:ih*${compressionPercentage}/100" "${outputFilePath}"`;

      // Execute FFmpeg command
      exec(ffmpegCommand, (error) => {
        if (error) {
          console.error('Error compressing video:', error);
          res.status(500).send('Error compressing video');
          return;
        }
        res.download(outputFilePath, (err) => {
          if (err) {
            console.error('Error downloading compressed file:', err);
            res.status(500).send('Error downloading compressed file');
          } else {
            console.log('File compressed and downloaded successfully');
          }
        });
      });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
