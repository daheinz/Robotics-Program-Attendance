import React, { useEffect, useMemo, useRef, useState } from 'react';
import { settingsApi, slideshowApi } from '../services/api';
import PresenceBoard from './PresenceBoard';
import './SlideshowPage.css';

const DEFAULTS = {
  intervalSeconds: 10,
  presenceEveryN: 2,
  presenceDurationSeconds: 30,
};

const JOKES = [
  'Why did the robot go to therapy? It had too many unresolved circuits.',
  'My robot vacuum quit. Said it was tired of my dirty attitude.',
  'The robot chef quit cooking. It couldn’t process the orders.',
  'Why don’t robots panic? They take things byte by byte.',
  'The robot comedian bombed. Turns out its jokes weren’t user‑friendly.',
  'Why did the robot get glasses? It lost its focus settings.',
  'My robot dog ran away. Guess it found a better owner.exe.',
  'Why did the robot cross the road? It was programmed to.',
  'Robots don’t get lost. They just recalculate their existence.',
  'The robot gardener quit. It couldn’t handle organic problems.',
  'Why did the robot fail art class? It couldn’t draw conclusions.',
  'My robot friend told me a secret. I guess it trusts my encryption.',
  'Why do robots make terrible liars? Their stories don’t compile.',
  'The robot singer was great — until it hit a runtime error.',
  'Why did the robot blush? It saw the power strip.',
  'Robots don’t argue. They just update their stance.',
  'My robot broke up with me. Said I wasn’t its type.',
  'Why did the robot get promoted? It had excellent workload management.',
  'The robot detective solved the case. It followed the data trail.',
  'Why did the robot join the band? It had great metal skills.',
  'Robots don’t get tired. They just low‑battery.',
  'Why did the robot take a nap? It needed to reboot its life.',
  'The robot poet wrote in binary. It was deeply encoded.',
  'Why did the robot hate nature? Too many bugs.',
  'My robot friend meditates. Says it helps with inner processing.',
  'Why did the robot get fired? It couldn’t think outside the box.',
  'The robot tailor quit. It couldn’t seam to get it right.',
  'Why did the robot love math? It had great algorithms.',
  'My robot roommate is messy. It leaves crumbs of code everywhere.',
  'Why did the robot go to school? To improve its syntax.',
  'Robots don’t gossip. They synchronize.',
  'Why did the robot get a cold? Too many open ports.',
  'The robot painter only used grayscale. It lacked emotional color drivers.',
  'Why did the robot join the gym? To improve its core.',
  'My robot therapist just nods. Probably buffering.',
  'Why did the robot get lost in thought? Infinite loop.',
  'The robot chef’s food was terrible. No taste parameters.',
  'Why did the robot become a teacher? It loved input/output.',
  'Robots don’t procrastinate. They just queue tasks indefinitely.',
  'Why did the robot get a pet? To practice human bonding protocols.',
  'The robot comedian got booed. It didn’t debug its set.',
  'Why did the robot go camping? To test its outdoor mode.',
  'My robot friend is dramatic. Always overheating.',
  'Why did the robot join the orchestra? It had perfect timing.',
  'Robots don’t dream. They simulate.',
  'Why did the robot get a tattoo? To express its firmware identity.',
  'The robot chef made soup. It was binary broth.',
  'Why did the robot get a job in finance? It loved compound interest.',
  'Robots don’t cry. They leak.',
  'Why did the robot go to the beach? To test its rust tolerance.',
  'My robot friend is sarcastic. Must be a patch update.',
  'Why did the robot become a writer? It had a way with characters.',
  'Robots don’t get jealous. They just monitor.',
  'Why did the robot go to the doctor? It had a bad sector.',
  'The robot baker made perfect bread. Great precision kneading.',
  'Why did the robot join the debate team? It had strong logic.',
  'Robots don’t get bored. They idle.',
  'Why did the robot start gardening? To grow its root directory.',
  'My robot friend loves puns. It’s pun‑ctional.',
  'Why did the robot become a DJ? It loved mixing signals.',
  'Robots don’t get angry. They throw exceptions.',
  'Why did the robot go to space? To find new data horizons.',
  'The robot tailor made pants. Perfect fit algorithms.',
  'Why did the robot get a library card? To access more knowledge.',
  'Robots don’t get hungry. They consume power.',
  'Why did the robot join the choir? It had a harmonic processor.',
  'My robot friend is moody. Must be voltage fluctuations.',
  'Why did the robot become a pilot? It loved control surfaces.',
  'Robots don’t get lonely. They network.',
  'Why did the robot take up painting? To explore creative subroutines.',
  'The robot comedian improved. It finally optimized its timing.',
  'Why did the robot go hiking? To test its terrain algorithms.',
  'Robots don’t get confused. They re-evaluate.',
  'Why did the robot become a therapist? It understood patterns.',
  'My robot friend is philosophical. Always asking about purpose.exe.',
  'Why did the robot start knitting? To practice thread management.',
  'Robots don’t get scared. They fail safely.',
  'Why did the robot become a chef? It loved precision cooking.',
  'The robot musician quit. Too many broken chords.',
  'Why did the robot go to the spa? To defragment.',
  'Robots don’t get embarrassed. They reset.',
  'Why did the robot become a detective? It followed logic trails.',
  'My robot friend is a minimalist. Prefers clean code.',
  'Why did the robot start a podcast? To share its data stories.',
  'Robots don’t get sick. They malfunction.',
  'Why did the robot become a lifeguard? Excellent scan range.',
  'The robot poet wrote haiku. Very compressed emotion.',
  'Why did the robot go fishing? To test its line control.',
  'Robots don’t get lost. They triangulate.',
  'Why did the robot become a barista? It mastered latte protocols.',
  'My robot friend is dramatic. Always overclocking.',
  'Why did the robot join the circus? Great balance algorithms.',
  'Robots don’t argue. They recompile.',
  'Why did the robot become a lawyer? It loved case logic.',
  'The robot chef made cake. Perfect layer architecture.',
  'Why did the robot take dance lessons? To improve its motion planning.',
  'Robots don’t forget. They archive.',
  'Why did the robot become a librarian? It loved organized data.',
  'My robot friend is poetic. Must be lyrical firmware.',
  'Why did the robot go to bed early? It needed a system update.',
];

function SlideshowPage() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shownSincePresence, setShownSincePresence] = useState(0);
  const [mode, setMode] = useState('image');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentJoke, setCurrentJoke] = useState('');
  const [jokeStyle, setJokeStyle] = useState({});
  const modeStartRef = useRef(Date.now());
  const modeDurationRef = useRef(DEFAULTS.intervalSeconds * 1000);
  const lastModeRef = useRef('image');
  const lastJokeRef = useRef('');

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

  useEffect(() => {
    if (loading || mode !== 'image' || images.length === 0) return;
    if (JOKES.length === 0) return;
    let nextJoke = JOKES[Math.floor(Math.random() * JOKES.length)];
    if (JOKES.length > 1 && nextJoke === lastJokeRef.current) {
      const nextIndex = (JOKES.indexOf(nextJoke) + 1) % JOKES.length;
      nextJoke = JOKES[nextIndex];
    }
    lastJokeRef.current = nextJoke;
    setCurrentJoke(nextJoke);

    const inset = 24;
    const edgeMargin = 14;
    const randomInset = Math.floor(Math.random() * 18);
    const topPos = inset + randomInset;
    const bottomPos = inset + randomInset;
    const leftPos = inset + randomInset;
    const rightPos = inset + randomInset;
    const randomPercent = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const edge = Math.floor(Math.random() * 4);
    let nextStyle = {};
    if (edge === 0) {
      nextStyle = { top: `${topPos}px`, left: `${randomPercent(6, 70)}%` };
    } else if (edge === 1) {
      nextStyle = { bottom: `${bottomPos}px`, left: `${randomPercent(6, 70)}%` };
    } else if (edge === 2) {
      nextStyle = { left: `${leftPos}px`, top: `${randomPercent(8, 65)}%` };
    } else {
      nextStyle = { right: `${rightPos}px`, top: `${randomPercent(8, 65)}%` };
    }

    nextStyle = {
      ...nextStyle,
      margin: `${edgeMargin}px`,
    };
    setJokeStyle(nextStyle);
  }, [loading, mode, currentIndex, images.length]);

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
      {currentJoke && (
        <div className="slideshow-joke" style={jokeStyle} aria-live="polite">
          {currentJoke}
        </div>
      )}
      <div className="slideshow-countdown">{remainingSeconds}s</div>
    </div>
  );
}

export default SlideshowPage;
