import React, { useEffect, useMemo, useRef, useState } from 'react';
import { settingsApi, slideshowApi } from '../services/api';
import PresenceBoard from './PresenceBoard';
import './SlideshowPage.css';

const DEFAULTS = {
  intervalSeconds: 10,
  presenceEveryN: 2,
  presenceDurationSeconds: 30,
};

function SlideshowPage() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shownSincePresence, setShownSincePresence] = useState(0);
  const [mode, setMode] = useState('image');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const modeStartRef = useRef(Date.now());
  const modeDurationRef = useRef(DEFAULTS.intervalSeconds * 1000);
  const lastModeRef = useRef('image');

  const normalizedSettings = useMemo(() => {
    const intervalSeconds = Math.max(1, Number(settings.intervalSeconds) || DEFAULTS.intervalSeconds);
    const presenceEveryN = Math.max(1, Number(settings.presenceEveryN) || DEFAULTS.presenceEveryN);
    const presenceDurationSeconds = Math.max(1, Number(settings.presenceDurationSeconds) || DEFAULTS.presenceDurationSeconds);
    return { intervalSeconds, presenceEveryN, presenceDurationSeconds };
  }, [settings]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [settingsResponse, imagesResponse] = await Promise.all([
          settingsApi.getPublic(),
          slideshowApi.list(),
        ]);
        const data = settingsResponse.data || {};
        setSettings({
          intervalSeconds: data.slideshow_interval_seconds ?? DEFAULTS.intervalSeconds,
          presenceEveryN: data.slideshow_presence_every_n ?? DEFAULTS.presenceEveryN,
          presenceDurationSeconds: data.slideshow_presence_duration_seconds ?? DEFAULTS.presenceDurationSeconds,
        });
        setImages(imagesResponse.data?.images || []);
        setCurrentIndex(0);
        setShownSincePresence(0);
        setMode('image');
        modeStartRef.current = Date.now();
        modeDurationRef.current = DEFAULTS.intervalSeconds * 1000;
      } catch (err) {
        setError('Failed to load slideshow settings or images.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const refreshSettings = async () => {
    try {
      const response = await settingsApi.getPublic();
      const data = response.data || {};
      setSettings({
        intervalSeconds: data.slideshow_interval_seconds ?? DEFAULTS.intervalSeconds,
        presenceEveryN: data.slideshow_presence_every_n ?? DEFAULTS.presenceEveryN,
        presenceDurationSeconds: data.slideshow_presence_duration_seconds ?? DEFAULTS.presenceDurationSeconds,
      });
    } catch (err) {
      // Silent refresh failure
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const response = await slideshowApi.list();
        const nextImages = response.data?.images || [];
        setImages((prev) => {
          if (prev.length !== nextImages.length) {
            return nextImages;
          }
          const prevNames = prev.map((img) => img.name).join('|');
          const nextNames = nextImages.map((img) => img.name).join('|');
          return prevNames === nextNames ? prev : nextImages;
        });
      } catch (err) {
        // Silent refresh failure
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (images.length > 0 && currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [images.length, currentIndex]);

  useEffect(() => {
    if (loading) return;

    if (mode === 'presence') {
      modeStartRef.current = Date.now();
      modeDurationRef.current = normalizedSettings.presenceDurationSeconds * 1000;
      const timer = setTimeout(() => {
        setMode('image');
      }, normalizedSettings.presenceDurationSeconds * 1000);
      return () => clearTimeout(timer);
    }

    if (images.length === 0) {
      return undefined;
    }

    modeStartRef.current = Date.now();
    modeDurationRef.current = normalizedSettings.intervalSeconds * 1000;
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      const nextCount = shownSincePresence + 1;

      if (nextCount >= normalizedSettings.presenceEveryN) {
        setShownSincePresence(0);
        setCurrentIndex(nextIndex);
        setMode('presence');
      } else {
        setShownSincePresence(nextCount);
        setCurrentIndex(nextIndex);
        setMode('image');
      }
    }, normalizedSettings.intervalSeconds * 1000);

    return () => clearTimeout(timer);
  }, [loading, mode, images.length, currentIndex, shownSincePresence, normalizedSettings]);

  useEffect(() => {
    if (loading) return;
    if (mode === 'presence' && lastModeRef.current !== 'presence') {
      refreshSettings();
    }
    lastModeRef.current = mode;
  }, [loading, mode]);

  useEffect(() => {
    if (loading) return;
    const updateRemaining = () => {
      const elapsed = Date.now() - modeStartRef.current;
      const remainingMs = Math.max(0, modeDurationRef.current - elapsed);
      setRemainingSeconds(Math.ceil(remainingMs / 1000));
    };
    updateRemaining();
    const intervalId = setInterval(updateRemaining, 250);
    return () => clearInterval(intervalId);
  }, [loading, mode]);

  if (loading) {
    return (
      <div className="slideshow-page">
        <div className="slideshow-message">Loading slideshow...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slideshow-page">
        <div className="slideshow-message slideshow-error">{error}</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="slideshow-page">
        <div className="slideshow-message">No slideshow images uploaded yet.</div>
      </div>
    );
  }

  if (mode === 'presence') {
    return (
      <div className="slideshow-page slideshow-presence">
        <PresenceBoard />
        <div className="slideshow-countdown">{remainingSeconds}s</div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="slideshow-page">
      <img
        className="slideshow-image"
        src={currentImage.url}
        alt={currentImage.name}
      />
      <div className="slideshow-countdown">{remainingSeconds}s</div>
    </div>
  );
}

export default SlideshowPage;
