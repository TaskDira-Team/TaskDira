import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Box, ChevronLeft, ChevronRight, Home, Layers, Loader2, Maximize2, Moon, RotateCcw, Sun, X } from 'lucide-react';
import HouseStage from './HouseStage';
import usePlayground from './usePlayground';
import { HOUSE_ROOMS } from './houseRooms';
const HouseJourney = lazy(() => import('./HouseJourney'));

export default function HouseExplorer({ he, activeRoom, onRoomChange }) {
  const [enabled, setEnabled] = useState(false);
  const [journey, setJourney] = useState(false);
  const [open, setOpen] = useState(true);
  const [night, setNight] = useState(false);
  const [view, setView] = useState('home');
  const previousRoom = useRef(activeRoom);
  const journeyTrigger = useRef(null);
  const [state] = usePlayground();
  const say = (h, e) => he ? h : e;
  const openJourney = event => { journeyTrigger.current = event.currentTarget; setJourney(true); };
  useEffect(() => {
    if (previousRoom.current === activeRoom) return;
    previousRoom.current = activeRoom; setEnabled(true); setView(activeRoom); setOpen(true);
  }, [activeRoom]);
  const visit = room => { setView(room); if (room !== 'home') { setOpen(true); onRoomChange(room); } };
  const next = () => visit(HOUSE_ROOMS[(HOUSE_ROOMS.findIndex(room => room.id === view) + 1) % HOUSE_ROOMS.length].id);
  return <div className={`td-house-explorer ${enabled ? 'is-active' : ''} ${night && enabled ? 'is-night' : ''}`}>
    {!enabled ? <>
      <img className="td-house-image" src="/images/taskdira-house.webp" alt={say('בית מיניאטורי חמים שאפשר לחקור', 'A cozy miniature home to explore')} width="1254" height="1254" fetchPriority="high" />
      <button className="td-explore-launch" onClick={openJourney}>
        <Box size={17} />
        <strong>{say('הדלת פתוחה. נכנסים?', 'The door is open. Step inside?')}</strong>
        <span>3D</span>
        <ArrowUpRight size={15} />
      </button>
      <button className="td-orbit-preview" onClick={() => setEnabled(true)} aria-label={say('סיבוב הבית בתלת־ממד', 'Rotate the house in 3D')}>
        <RotateCcw size={15} />
      </button>
    </> : <>
      <HouseStage he={he} view={view} open={open} night={night} completed={state.completed} onRoomChange={visit} />
      <button className="td-explore-close" onClick={() => setEnabled(false)} aria-label={say('חזרה לאיור', 'Return to illustration')}>
        <X size={17} />
      </button>
      <div className="td-house-toolbar">
        <button onClick={() => visit('home')} aria-label={say('מבט על כל הבית', 'Whole house view')}>
          <RotateCcw size={15} />
        </button>
        <button onClick={() => { if (open) visit('home'); setOpen(!open); }} aria-pressed={open}>
          <Layers size={15} />{open ? say('סגירת הגג', 'Close roof') : say('פתיחת הבית', 'Open house')}</button>
        <button onClick={() => setNight(!night)} aria-pressed={night} aria-label={say('מצב לילה', 'Night mode')}>{night ? <Moon size={15} /> : <Sun size={15} />}</button>
      </div>
      <button className="td-inline-journey" onClick={openJourney}>
        <Maximize2 size={14} />{say('הסיור המלא', 'The full experience')}</button>
      <div className="td-room-navigation" aria-label={say('סיור בחדרים', 'Room tour')}>
        <button onClick={() => visit('home')} aria-pressed={view === 'home'} aria-label={say('כל הבית', 'Whole home')}>
          <Home size={15} />
        </button>
        {HOUSE_ROOMS.map(room => <button key={room.id} onClick={() => visit(room.id)} aria-pressed={view === room.id}>{room.id === 'kitchen' ? say('מטבח', 'Kitchen') : room.id === 'living' ? say('סלון', 'Living room') : say('חדר שינה', 'Bedroom')}</button>)}
        <button onClick={next} aria-label={say('לחדר הבא', 'Next room')}>{he ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}</button>
      </div>
    </>}
    {journey && <Suspense fallback={<span className="td-journey-loading" role="status">
      <Loader2 className="animate-spin" size={17} />{say('רק פותחים את הדלת…', 'Just opening the door…')}</span>}>
      <HouseJourney he={he} returnFocus={journeyTrigger.current} onClose={() => setJourney(false)} />
    </Suspense>}
  </div>;
}
