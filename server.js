const express = require('express');
const multer = require('multer');
const path = require('path');
const uuid = require('uuid').v4;
const dotenv = require('dotenv');
const fs = require('fs'); // Import fs for file system operations like deletion

// Load environment variables from .env file
dotenv.config();

// Initialize the app
const app = express();

// Configure file upload settings using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    // Ensure the directory exists
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Create a route to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded',
      data: null,
      error: { code: 400, details: 'No file uploaded' },
    });
  }

  // Generate a URL for the uploaded file
  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    status: 'success',
    message: 'File uploaded successfully',
    data: { fileUrl },
    error: null,
  });
});

// Create a route to handle file deletion
app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const filePath = path.join(uploadDir, filename);

  // Check if the file exists
  fs.exists(filePath, (exists) => {
    if (!exists) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found',
        data: null,
        error: { code: 404, details: 'File not found' },
      });
    }

    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to delete file',
          data: null,
          error: { code: 500, details: 'Failed to delete file' },
        });
      }

      // Respond with success
      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
        data: null,
        error: null,
      });
    });
  });
});

// Serve static files (uploaded images) from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Start the server
const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 3000;

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
