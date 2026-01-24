const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireMentorOrCoach } = require('../middleware/auth');
const slideshowController = require('../controllers/slideshowController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, slideshowController.getSlidesDir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    const stamp = Date.now();
    cb(null, `${base}_${stamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.png', '.jpg', '.jpeg'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG and JPG images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Public list of images
router.get('/images', slideshowController.getImages);

// Upload/delete (mentor/coach/admin)
router.post('/images', requireMentorOrCoach, upload.single('image'), slideshowController.uploadImage);
router.delete('/images/:filename', requireMentorOrCoach, slideshowController.deleteImage);

module.exports = router;
