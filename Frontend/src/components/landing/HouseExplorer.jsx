import { useEffect, useRef, useState } from 'react';
import { Box, ChevronLeft, ChevronRight, Home, Layers, Loader2, RotateCcw, X } from 'lucide-react';

const ROOMS = ['kitchen', 'living', 'bedroom'];
export default function HouseExplorer({ he, activeRoom, onRoomChange }) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState('idle');
  const [open, setOpen] = useState(true);
  const [view, setView] = useState('home');
  const host = useRef(null);
  const scene = useRef(null);
  const say = (h, e) => he ? h : e;
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setStatus('loading');
    let cleanup;
    import('./houseScene').then(({ createHouseScene }) => {
      if (cancelled) return;
      const instance = createHouseScene(host.current);
      scene.current = instance;
      const onLoss = event => { event.preventDefault(); setStatus('error'); instance.dispose(); scene.current = null; };
      const canvas = host.current.querySelector('canvas');
      canvas.addEventListener('webglcontextlost', onLoss);
      cleanup = () => { canvas.removeEventListener('webglcontextlost', onLoss); if (scene.current) instance.dispose(); scene.current = null; };
      instance.setOpen(true); setOpen(true); setView('home'); setStatus('ready');
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; cleanup?.(); };
  }, [enabled]);
  useEffect(() => { if (scene.current) { scene.current.setRoom(activeRoom); setView(activeRoom); setOpen(true); } }, [activeRoom]);
  const visit = room => { setView(room); scene.current?.setRoom(room); if (room !== 'home') { setOpen(true); onRoomChange(room); } };
  const next = () => visit(ROOMS[(ROOMS.indexOf(view) + 1) % ROOMS.length]);
  return <div className={`td-house-explorer ${enabled ? 'is-active' : ''}`}>
    <img className="td-house-image" src="/images/taskdira-house.webp" alt={say('בית מיניאטורי חמים שאפשר לחקור', 'A cozy miniature home to explore')} width="1254" height="1254" fetchPriority="high" style={enabled && status === 'ready' ? { visibility: 'hidden' } : undefined} />
    {!enabled ? <button className="td-explore-launch" onClick={() => setEnabled(true)}>
      <Box size={17} />
      <strong>{say('בואו ניכנס פנימה', 'Let’s step inside')}</strong>
      <span>3D</span>
    </button> : <>
      <div className="td-live-house" ref={host} role="img" aria-label={say('דגם תלת־ממדי של הבית. השתמשו בכפתורי החדרים לסיור.', '3D house model. Use the room buttons to explore.')} />
      <button className="td-explore-close" onClick={() => setEnabled(false)} aria-label={say('חזרה לאיור', 'Return to illustration')}>
        <X size={17} />
      </button>
      {status === 'loading' && <div className="td-explore-status" role="status">
        <Loader2 className="animate-spin" size={18} />{say('פותחים את הדלת…', 'Opening the door…')}</div>}
      {status === 'error' && <div className="td-explore-status" role="status">{say('תלת־ממד לא זמין בדפדפן הזה. האיור עדיין כאן בשבילכם.', '3D isn’t available in this browser. You can still enjoy the illustrated home.')}</div>}
      {status === 'ready' && <>
        <div className="td-house-toolbar">
          <button onClick={() => visit('home')} aria-label={say('מבט על כל הבית', 'Whole house view')}>
            <RotateCcw size={15} />
          </button>
          <button onClick={() => { scene.current?.setOpen(!open); if (open) visit('home'); setOpen(!open); }} aria-pressed={open}>
            <Layers size={15} />{open ? say('סגירת הגג', 'Close roof') : say('פתיחת הבית', 'Open house')}</button>
          <span>{say('גררו כדי להסתובב', 'Drag to look around')}</span>
        </div>
        <div className="td-room-navigation" aria-label={say('סיור בחדרים', 'Room tour')}>
          <button onClick={() => visit('home')} aria-pressed={view === 'home'} aria-label={say('כל הבית', 'Whole home')}>
            <Home size={15} />
          </button>
          {ROOMS.map(id => <button key={id} onClick={() => visit(id)} aria-pressed={view === id}>{id === 'kitchen' ? say('מטבח', 'Kitchen') : id === 'living' ? say('סלון', 'Living room') : say('חדר שינה', 'Bedroom')}</button>)}
          <button onClick={next} aria-label={say('לחדר הבא', 'Next room')}>{he ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}</button>
        </div>
      </>}
    </>}
  </div>;
}
