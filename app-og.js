const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

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
      const outputFilePath = `./compressed/${req.file.originalname}`;

      // Command to compress using FFmpeg
      const compressionPercentage = req.body.compressionPercentage;
      const ffmpegCommand = `ffmpeg -i ${inputFilePath} -vf "scale=iw*${compressionPercentage}/100:ih*${compressionPercentage}/100" ${outputFilePath}`;

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
