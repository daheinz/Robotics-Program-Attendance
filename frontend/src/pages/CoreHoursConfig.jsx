import React, { useState, useEffect } from 'react';
import './CoreHoursConfig.css';
import api from '../services/api';

export default function CoreHoursConfig() {
  const [coreHours, setCoreHours] = useState([]);
  const [seasonType, setSeasonType] = useState('build');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    startTime: '17:30',
    endTime: '20:00',
    type: 'required',
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch core hours when season type changes
  useEffect(() => {
    fetchCoreHours();
  }, [seasonType]);

  const fetchCoreHours = async () => {
    try {
      setLoading(true);
      const response = await api.get('/core-hours', {
        params: { seasonType }
      });
      setCoreHours(response.data);
    } catch (error) {
      console.error('Error fetching core hours:', error);
      alert('Failed to fetch core hours');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dayOfWeek' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.startTime || !formData.endTime) {
      alert('Please fill in all fields');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert('Start time must be before end time');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        seasonType
      };

      if (editingId) {
        await api.put(`/core-hours/${editingId}`, payload);
        alert('Core hours updated successfully');
      } else {
        await api.post('/core-hours', payload);
        alert('Core hours created successfully');
      }

      setFormData({
        dayOfWeek: 0,
        startTime: '17:30',
        endTime: '20:00',
        type: 'required',
      });
      setEditingId(null);
      setShowForm(false);
      fetchCoreHours();
    } catch (error) {
      console.error('Error saving core hours:', error);
      alert('Failed to save core hours: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (hours) => {
    setFormData({
      dayOfWeek: hours.day_of_week,
      startTime: hours.start_time,
      endTime: hours.end_time,
      type: hours.type,
    });
    setEditingId(hours.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this core hours entry?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/core-hours/${id}`);
      alert('Core hours deleted successfully');
      fetchCoreHours();
    } catch (error) {
      console.error('Error deleting core hours:', error);
      alert('Failed to delete core hours');
    } finally {
      setLoading(false);
    }
  };

  const groupByDay = () => {
    const grouped = {};
    coreHours.forEach(hour => {
      const day = dayNames[hour.day_of_week];
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(hour);
    });
    return grouped;
  };

  const formatTime = (time) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupedHours = groupByDay();

  return (
    <div className="core-hours-config">
      <h1>Core Hours Configuration</h1>

      <div className="controls">
        <div className="season-selector">
          <label>Season Type:</label>
          <select 
            value={seasonType}
            onChange={(e) => setSeasonType(e.target.value)}
            disabled={loading}
          >
            <option value="build">Build Season</option>
            <option value="offseason">Off-Season</option>
          </select>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setFormData({
                dayOfWeek: 0,
                startTime: '17:30',
                endTime: '20:00',
                type: 'required',
              });
              setEditingId(null);
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add Core Hours'}
        </button>
      </div>

      {showForm && (
        <form className="core-hours-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Core Hours' : 'Add New Core Hours'}</h2>

          <div className="form-group">
            <label>Day of Week *</label>
            <select 
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleInputChange}
              disabled={editingId !== null}
              required
            >
              {dayNames.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input 
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time *</label>
              <input 
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select 
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="required">Required</option>
              <option value="suggested">Suggested</option>
            </select>
            <small>Required hours must be met. Suggested hours are optional.</small>
          </div>

          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="schedule-display">
        {loading && <p className="loading">Loading...</p>}

        {!loading && coreHours.length === 0 && (
          <p className="no-data">
            No core hours configured for {seasonType} season
          </p>
        )}

        {!loading && coreHours.length > 0 && (
          <div>
            <h2>{seasonType === 'build' ? 'Build Season' : 'Off-Season'} Schedule</h2>
            <div className="schedule-grid">
              {Object.keys(groupedHours).map((day) => (
                <div key={day} className="day-block">
                  <h3>{day}</h3>
                  <div className="times">
                    {groupedHours[day].map((hour) => (
                      <div key={hour.id} className={`time-slot type-${hour.type}`}>
                        <div className="time-range">
                          {formatTime(hour.start_time)} - {formatTime(hour.end_time)}
                        </div>
                        <div className="type-badge">{hour.type}</div>
                        <div className="actions">
                          <button 
                            className="btn-small btn-edit"
                            onClick={() => handleEdit(hour)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn-small btn-delete"
                            onClick={() => handleDelete(hour.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
