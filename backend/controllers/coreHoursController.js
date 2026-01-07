const CoreHours = require('../models/CoreHours');

// Create new core hours entry
exports.createCoreHours = async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime, type = 'required', seasonType = 'build' } = req.body;
    
    // Validate input
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: 'dayOfWeek, startTime, and endTime are required' });
    }
    
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'dayOfWeek must be 0-6 (Sunday-Saturday)' });
    }
    
    if (!['required', 'suggested'].includes(type)) {
      return res.status(400).json({ error: 'type must be "required" or "suggested"' });
    }
    
    if (!['build', 'offseason'].includes(seasonType)) {
      return res.status(400).json({ error: 'seasonType must be "build" or "offseason"' });
    }
    
    const coreHours = await CoreHours.create({ dayOfWeek, startTime, endTime, type, seasonType });
    res.status(201).json(coreHours);
  } catch (error) {
    next(error);
  }
};

// Get all core hours for a season
exports.getCoreHoursBySeasonType = async (req, res, next) => {
  try {
    const seasonType = req.query.seasonType || 'build';
    
    if (!['build', 'offseason'].includes(seasonType)) {
      return res.status(400).json({ error: 'seasonType must be "build" or "offseason"' });
    }
    
    const coreHours = await CoreHours.findBySeasonType(seasonType);
    res.json(coreHours);
  } catch (error) {
    next(error);
  }
};

// Get core hours for a specific day
exports.getCoreHoursByDay = async (req, res, next) => {
  try {
    const { dayOfWeek } = req.params;
    const seasonType = req.query.seasonType || 'build';
    
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'dayOfWeek must be 0-6' });
    }
    
    const coreHours = await CoreHours.findByDayAndSeason(parseInt(dayOfWeek), seasonType);
    res.json(coreHours);
  } catch (error) {
    next(error);
  }
};

// Get all core hours
exports.getAllCoreHours = async (req, res, next) => {
  try {
    const seasonType = req.query.seasonType || null;
    const coreHours = await CoreHours.findAll(seasonType);
    res.json(coreHours);
  } catch (error) {
    next(error);
  }
};

// Update core hours
exports.updateCoreHours = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, type, seasonType, isActive } = req.body;
    
    const coreHours = await CoreHours.update(id, { startTime, endTime, type, seasonType, isActive });
    
    if (!coreHours) {
      return res.status(404).json({ error: 'Core hours not found' });
    }
    
    res.json(coreHours);
  } catch (error) {
    next(error);
  }
};

// Delete core hours
exports.deleteCoreHours = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const coreHours = await CoreHours.delete(id);
    
    if (!coreHours) {
      return res.status(404).json({ error: 'Core hours not found' });
    }
    
    res.json({ message: 'Core hours deleted', coreHours });
  } catch (error) {
    next(error);
  }
};
