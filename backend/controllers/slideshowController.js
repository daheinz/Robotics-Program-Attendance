const fs = require('fs');
const path = require('path');

const SLIDES_DIR = path.join(__dirname, '..', 'storage', 'slideshow');

const ensureSlidesDir = () => {
  fs.mkdirSync(SLIDES_DIR, { recursive: true });
};

const isAllowedImage = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return ['.png', '.jpg', '.jpeg'].includes(ext);
};

exports.getImages = async (req, res) => {
  try {
    ensureSlidesDir();
    const files = fs.readdirSync(SLIDES_DIR)
      .filter((file) => isAllowedImage(file))
      .sort((a, b) => a.localeCompare(b));

    const images = files.map((file) => ({
      name: file,
      url: `/slideshow-assets/${encodeURIComponent(file)}`,
    }));

    res.json({ images });
  } catch (error) {
    console.error('Error listing slideshow images:', error);
    res.status(500).json({ error: 'Failed to list slideshow images' });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.status(201).json({
      name: req.file.filename,
      url: `/slideshow-assets/${encodeURIComponent(req.file.filename)}`,
    });
  } catch (error) {
    console.error('Error uploading slideshow image:', error);
    res.status(500).json({ error: 'Failed to upload slideshow image' });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    ensureSlidesDir();
    const filename = path.basename(req.params.filename);
    const filePath = path.join(SLIDES_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, filename });
  } catch (error) {
    console.error('Error deleting slideshow image:', error);
    res.status(500).json({ error: 'Failed to delete slideshow image' });
  }
};

exports.getSlidesDir = () => {
  ensureSlidesDir();
  return SLIDES_DIR;
};
