const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const DEFAULTS = {
  reflectionPrompt: 'Please reflect on what you learned or accomplished today.',
  presenceStartHour: 8,
  presenceEndHour: 24,
  colorStudentCheckedIn: '#48bb78',
  colorMentorCheckedIn: '#4299e1',
  colorNotCheckedIn: '#a0aec0',
  colorPastSession: '#4fd1c5',
  colorActiveSession: '#f6e05e',
  colorCurrentTime: '#ff6b6b',
  slideshowIntervalSeconds: 10,
  slideshowPresenceEveryN: 2,
  slideshowPresenceDurationSeconds: 30,
};

class SystemSettings {
  static withDefaults(row = {}) {
    return {
      ...row,
      reflection_prompt: row.reflection_prompt ?? DEFAULTS.reflectionPrompt,
      presence_start_hour: row.presence_start_hour ?? DEFAULTS.presenceStartHour,
      presence_end_hour: row.presence_end_hour ?? DEFAULTS.presenceEndHour,
      color_student_checked_in: row.color_student_checked_in ?? DEFAULTS.colorStudentCheckedIn,
      color_mentor_checked_in: row.color_mentor_checked_in ?? DEFAULTS.colorMentorCheckedIn,
      color_not_checked_in: row.color_not_checked_in ?? DEFAULTS.colorNotCheckedIn,
      color_past_session: row.color_past_session ?? DEFAULTS.colorPastSession,
      color_active_session: row.color_active_session ?? DEFAULTS.colorActiveSession,
      color_current_time: row.color_current_time ?? DEFAULTS.colorCurrentTime,
      slideshow_interval_seconds: row.slideshow_interval_seconds ?? DEFAULTS.slideshowIntervalSeconds,
      slideshow_presence_every_n: row.slideshow_presence_every_n ?? DEFAULTS.slideshowPresenceEveryN,
      slideshow_presence_duration_seconds: row.slideshow_presence_duration_seconds ?? DEFAULTS.slideshowPresenceDurationSeconds,
    };
  }

  static async get() {
    const query = 'SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1';
    const result = await db.query(query);
    
    if (result.rows.length === 0) {
      // Create default settings if none exist
      return this.create(DEFAULTS.reflectionPrompt, DEFAULTS.presenceStartHour, DEFAULTS.presenceEndHour);
    }
    
    return this.withDefaults(result.rows[0]);
  }

  static async create(
    reflectionPrompt,
    presenceStartHour = DEFAULTS.presenceStartHour,
    presenceEndHour = DEFAULTS.presenceEndHour,
    colors = {},
    slideshow = {}
  ) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO system_settings (
        id, reflection_prompt, presence_start_hour, presence_end_hour,
        color_student_checked_in, color_mentor_checked_in, color_not_checked_in,
        color_past_session, color_active_session, color_current_time,
        slideshow_interval_seconds, slideshow_presence_every_n, slideshow_presence_duration_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      id,
      reflectionPrompt,
      presenceStartHour,
      presenceEndHour,
      colors.colorStudentCheckedIn ?? DEFAULTS.colorStudentCheckedIn,
      colors.colorMentorCheckedIn ?? DEFAULTS.colorMentorCheckedIn,
      colors.colorNotCheckedIn ?? DEFAULTS.colorNotCheckedIn,
      colors.colorPastSession ?? DEFAULTS.colorPastSession,
      colors.colorActiveSession ?? DEFAULTS.colorActiveSession,
      colors.colorCurrentTime ?? DEFAULTS.colorCurrentTime,
      slideshow.slideshowIntervalSeconds ?? DEFAULTS.slideshowIntervalSeconds,
      slideshow.slideshowPresenceEveryN ?? DEFAULTS.slideshowPresenceEveryN,
      slideshow.slideshowPresenceDurationSeconds ?? DEFAULTS.slideshowPresenceDurationSeconds,
    ];
    const result = await db.query(query, values);
    return this.withDefaults(result.rows[0]);
  }

  static async update({
    reflectionPrompt,
    presenceStartHour,
    presenceEndHour,
    colorStudentCheckedIn,
    colorMentorCheckedIn,
    colorNotCheckedIn,
    colorPastSession,
    colorActiveSession,
    colorCurrentTime,
    slideshowIntervalSeconds,
    slideshowPresenceEveryN,
    slideshowPresenceDurationSeconds,
  }) {
    // Get current settings
    const current = await this.get();
    const nextReflectionPrompt = reflectionPrompt ?? current.reflection_prompt;
    const nextStartHour = presenceStartHour ?? current.presence_start_hour;
    const nextEndHour = presenceEndHour ?? current.presence_end_hour;
    const nextColorStudentCheckedIn = colorStudentCheckedIn ?? current.color_student_checked_in;
    const nextColorMentorCheckedIn = colorMentorCheckedIn ?? current.color_mentor_checked_in;
    const nextColorNotCheckedIn = colorNotCheckedIn ?? current.color_not_checked_in;
    const nextColorPastSession = colorPastSession ?? current.color_past_session;
    const nextColorActiveSession = colorActiveSession ?? current.color_active_session;
    const nextColorCurrentTime = colorCurrentTime ?? current.color_current_time;
    const nextSlideshowIntervalSeconds = slideshowIntervalSeconds ?? current.slideshow_interval_seconds;
    const nextSlideshowPresenceEveryN = slideshowPresenceEveryN ?? current.slideshow_presence_every_n;
    const nextSlideshowPresenceDurationSeconds = slideshowPresenceDurationSeconds ?? current.slideshow_presence_duration_seconds;
    
    const query = `
      UPDATE system_settings 
      SET reflection_prompt = $1,
          presence_start_hour = $2,
          presence_end_hour = $3,
          color_student_checked_in = $4,
          color_mentor_checked_in = $5,
          color_not_checked_in = $6,
          color_past_session = $7,
          color_active_session = $8,
          color_current_time = $9,
          slideshow_interval_seconds = $10,
          slideshow_presence_every_n = $11,
          slideshow_presence_duration_seconds = $12,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;
    
    const result = await db.query(query, [
      nextReflectionPrompt,
      nextStartHour,
      nextEndHour,
      nextColorStudentCheckedIn,
      nextColorMentorCheckedIn,
      nextColorNotCheckedIn,
      nextColorPastSession,
      nextColorActiveSession,
      nextColorCurrentTime,
      nextSlideshowIntervalSeconds,
      nextSlideshowPresenceEveryN,
      nextSlideshowPresenceDurationSeconds,
      current.id
    ]);
    return this.withDefaults(result.rows[0]);
  }
}

module.exports = SystemSettings;
