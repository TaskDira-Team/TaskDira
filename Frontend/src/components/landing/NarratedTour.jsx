import { useEffect, useRef, useState } from 'react';
import { Headphones, Pause, Play, Volume2, X } from 'lucide-react';
import { activeTourSection, chooseVoice, TOUR_SECTIONS } from './tourContent';

export default function NarratedTour({ he }) {
  const [enabled, setEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const [voices, setVoices] = useState([]);
  const [issue, setIssue] = useState('');
  const [replay, setReplay] = useState(0);
  const [talking, setTalking] = useState(false);
  const spoken = useRef(null);
  const generation = useRef(0);
  const available = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const language = he ? 'he' : 'en';
  const voice = chooseVoice(voices, language);
  const say = (h, e) => he ? h : e;
  const section = TOUR_SECTIONS[index];
  const stop = () => { generation.current++; setTalking(false); if (available) window.speechSynthesis.cancel(); };
  useEffect(() => {
    if (!available) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh(); window.speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', refresh); window.speechSynthesis.cancel(); };
  }, [available]);
  useEffect(() => {
    if (!enabled) return;
    let timer;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const positions = TOUR_SECTIONS.map(item => ({ top: document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity }));
        setIndex(activeTourSection(positions, window.innerHeight * 0.42));
      }, 300);
    };
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener('scroll', update); };
  }, [enabled]);
  useEffect(() => {
    stop();
    if (!enabled || paused || !available || document.hidden) return;
    const key = `${language}:${index}`;
    if (!voice) { setIssue('voice'); return; }
    if (spoken.current === key) return;
    setIssue('');
    const speech = new SpeechSynthesisUtterance(he ? section.textHe : section.textEn);
    speech.voice = voice; speech.lang = voice.lang; speech.rate = 0.96; speech.volume = 0.8;
    const token = generation.current;
    speech.onstart = () => { if (generation.current === token) setTalking(true); };
    speech.onend = () => { if (generation.current === token) setTalking(false); };
    speech.onerror = event => { if (generation.current === token && !['interrupted', 'canceled'].includes(event.error)) { spoken.current = null; setTalking(false); setIssue('speech'); } };
    spoken.current = key;
    window.speechSynthesis.speak(speech);
    return stop;
  }, [enabled, paused, index, language, voice?.voiceURI, replay]);
  useEffect(() => {
    const onHidden = () => { if (document.hidden) { stop(); spoken.current = null; setPaused(true); } };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, []);
  const start = () => {
    const positions = TOUR_SECTIONS.map(item => ({ top: document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity }));
    setIndex(activeTourSection(positions, window.innerHeight * 0.42));
    spoken.current = null; setIssue(''); setPaused(false); setEnabled(true);
  };
  const toggle = () => { stop(); spoken.current = null; setPaused(!paused); };
  if (!enabled) return <button className="td-tour-launch" onClick={start}>
    <Headphones size={16} />
    <span>{say('סיור קולי', 'Audio tour')}</span>
    <span className="td-tour-new">{say('חדש', 'NEW')}</span>
  </button>;
  return <aside className="td-audio-tour" aria-label={say('סיור קולי', 'Audio tour')}>
    <div className="td-audio-top">
      <span className={`td-audio-icon ${talking ? 'is-speaking' : ''}`} aria-label={talking ? say('הקריינות מתנגנת', 'Narration playing') : undefined}>
        <Volume2 size={17} />{talking && <i aria-hidden="true" />}</span>
      <div>
        <small>{say('הסיפור של הבית', 'THE STORY OF YOUR HOME')}</small>
        <strong>{he ? section.he : section.en}</strong>
      </div>
      <span className="td-audio-count">{index + 1} / {TOUR_SECTIONS.length}</span>
      <button onClick={() => { stop(); spoken.current = null; setEnabled(false); }} aria-label={say('כיבוי הסיור הקולי', 'Turn off audio tour')}>
        <X size={17} />
      </button>
    </div>
    <p className="td-audio-caption">{he ? section.textHe : section.textEn}</p>
    {(!available || issue) && <p className="td-audio-issue" role="status">{!available ? say('הדפדפן לא תומך בקריינות. אפשר לעקוב אחר הכתוביות.', 'Speech is unavailable in this browser. Follow the captions instead.') : issue === 'voice' ? say('אין כרגע קול עברי זמין במכשיר. הכתוביות ממשיכות ללוות את הסיור.', 'No English voice is available on this device. Captions are still available.') : say('הקריינות לא הופעלה. נסו שוב או עקבו אחר הכתוביות.', 'Speech couldn’t start. Replay or follow the captions.')}</p>}
    <div className="td-audio-footer">
      <button onClick={toggle}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? say('המשך', 'Resume') : say('השהיה', 'Pause')}</button>
      <button onClick={() => { spoken.current = null; stop(); setPaused(false); setReplay(value => value + 1); }}>{say('התחלה מחדש', 'Replay')}</button>
      <span>{say('גללו — הסיפור ממשיך אתכם', 'Scroll. The story follows you.')}</span>
    </div>
  </aside>;
}
