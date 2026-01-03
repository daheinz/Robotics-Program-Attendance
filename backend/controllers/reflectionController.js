const Reflection = require('../models/Reflection');

class ReflectionController {
  // GET /reflections - Get all reflections (admin)
  static async getAll(req, res) {
    try {
      const reflections = await Reflection.findAll();
      res.json(reflections);
    } catch (error) {
      console.error('Error fetching reflections:', error);
      res.status(500).json({ error: 'Failed to fetch reflections' });
    }
  }

  // GET /reflections/user/:id - Get reflections for a specific user
  static async getByUserId(req, res) {
    try {
      const { id } = req.params;
      const reflections = await Reflection.findByUserId(id);
      res.json(reflections);
    } catch (error) {
      console.error('Error fetching user reflections:', error);
      res.status(500).json({ error: 'Failed to fetch reflections' });
    }
  }
}

module.exports = ReflectionController;
