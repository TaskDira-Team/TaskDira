import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Home, Layers3, Moon, Pause, Play, Sparkles, Sun, X, Zap } from 'lucide-react';
import HouseStage from './HouseStage';
import { HOUSE_ROOMS } from './houseRooms';
import { balance, completeQuest, QUESTS } from './demoState';
import usePlayground from './usePlayground';

export default function HouseJourney({ he, onClose, returnFocus }) {
  const dialog = useRef(null);
  const content = useRef(null);
  const [view, setView] = useState('home');
  const [night, setNight] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [tour, setTour] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [replay, setReplay] = useState(null);
  const [state, update] = usePlayground();
  const say = (h, e) => he ? h : e;
  const Arrow = he ? ArrowLeft : ArrowRight;
  const room = HOUSE_ROOMS.find(item => item.id === view);
  const roomIndex = HOUSE_ROOMS.indexOf(room);
  const quest = room && QUESTS.find(item => item.id === room.quest);
  const completed = quest && state.completed.includes(quest.id);
  const totalDone = HOUSE_ROOMS.filter(item => state.completed.includes(item.quest)).length;
  useEffect(() => {
    const previousFocus = returnFocus || document.activeElement;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    modal.showModal();
    modal.focus({ preventScroll: true });
    window.dispatchEvent(new Event('taskdira:house-journey'));
    return () => { modal.close(); document.body.style.overflow = previousOverflow; document.documentElement.style.overflow = previousRootOverflow; if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    if (window.matchMedia('(max-width:700px)').matches) content.current?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' });
  }, [view]);
  useEffect(() => {
    if (!tour || !sceneReady) return;
    const timer = setTimeout(() => {
      if (roomIndex === HOUSE_ROOMS.length - 1) { setTour(false); setView('home'); }
      else setView(HOUSE_ROOMS[roomIndex + 1].id);
    }, 8500);
    return () => clearTimeout(timer);
  }, [tour, view, sceneReady]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setTour(false); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  const visit = id => { setTour(false); setView(id); setExploded(false); setAnnouncement(''); };
  const next = () => visit(HOUSE_ROOMS[(roomIndex + 1) % HOUSE_ROOMS.length].id);
  const previous = () => visit(roomIndex <= 0 ? 'home' : HOUSE_ROOMS[roomIndex - 1].id);
  const complete = () => {
    if (!quest || completed) return;
    setTour(false);
    update(current => completeQuest(current, quest.id));
    setAnnouncement(say(`איזה כיף! ${quest.points} נקודות נוספו לדמו שלכם.`, `Nice! ${quest.points} points added to your playground.`));
  };
  return <dialog ref={dialog} tabIndex={-1} className={`td-journey ${night ? 'is-night' : ''}`} dir={he ? 'rtl' : 'ltr'} aria-labelledby="td-journey-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="td-journey-shell">
      <header className="td-journey-header">
        <div className="td-journey-brand">
          <span>
            <Home size={20} />
          </span>
          <div>
            <strong>TaskDira<span>.</span>
            </strong>
            <small>{say('בית קטן. עולם שלם.', 'A LITTLE HOME. A WHOLE WORLD.')}</small>
          </div>
        </div>
        <div className="td-journey-header-actions">
          <div className="td-journey-wallet" aria-label={say('נקודות בדמו', 'Playground points')}>
            <Zap size={15} fill="currentColor" />
            <strong key={balance(state)}>{balance(state)}</strong>
            <span>XP</span>
          </div>
          <button className="td-day-switch" onClick={() => setNight(!night)} aria-pressed={night} aria-label={say('מצב לילה', 'Night mode')}>{night ? <Moon size={17} /> : <Sun size={17} />}<span>{night ? say('ערב טוב', 'Evening') : say('יום נעים', 'Daylight')}</span>
          </button>
          <button className="td-journey-close" onClick={onClose} aria-label={say('סגירת הסיור בבית', 'Close house tour')}>
            <X size={21} />
          </button>
        </div>
      </header>
      <div className="td-journey-content" ref={content}>
        <div className="td-journey-world">
          <div className="td-world-grain" aria-hidden="true" />
          <div className="td-world-orbit" aria-hidden="true" />
          <div className="td-world-coordinate">
            <i />{night ? say('21:04 / הזמן להוריד הילוך', '21:04 / TIME TO SLOW DOWN') : say('09:41 / יום חדש בבית', '09:41 / A FRESH START')}</div>
          <HouseStage he={he} view={view} night={night} exploded={exploded} completed={state.completed} replay={replay} onRoomChange={visit} onInteract={() => setTour(false)} onReady={() => setSceneReady(true)} />
          <div className="td-world-tools">
            <button onClick={() => { setTour(false); setView('home'); setExploded(!exploded); }} aria-pressed={exploded}>
              <Layers3 size={16} />{exploded ? say('מחברים בחזרה', 'Bring it together') : say('מבט בין הקומות', 'Peek between floors')}</button>
            <span>{say('גררו כדי לגלות זווית חדשה', 'DRAG TO FIND A NEW PERSPECTIVE')}</span>
          </div>
          <div className="td-floor-map" aria-label={say('מפת החדרים', 'Room map')}>
            <span>{say('אתם כאן', 'YOU ARE HERE')}</span>
            <div>
              <button aria-label={say('מבט על הבית', 'Overview')} aria-pressed={view === 'home'} onClick={() => visit('home')}>
                <Home size={14} />
              </button>{HOUSE_ROOMS.map(item => <button key={item.id} onClick={() => visit(item.id)} aria-pressed={view === item.id} aria-label={he ? item.he : item.en}>{state.completed.includes(item.quest) ? <Check size={12} /> : item.number}</button>)}</div>
          </div>
          <span className="td-world-caption">{say('כל חדר הוא התחלה של משהו טוב.', 'A little good in every room.')}<span>↗</span>
          </span>
        </div>
        <aside className="td-journey-story">
          <div className="td-story-content" key={view}>
            <span className="td-story-kicker">
              <i />{room ? `${room.number} / ${he ? room.he : room.en}` : say('הדלת פתוחה. בואו.', 'THE DOOR IS OPEN. COME ON IN.')}</span>
            <h2 id="td-journey-title">{room ? (he ? room.titleHe : room.titleEn) : say('בית שמרגיש\nקצת יותר ביחד.', 'A home that feels\na little more together.')}</h2>
            <p className="td-story-description">{room ? (he ? room.textHe : room.textEn) : say('תיכנסו. תסתובבו. תדליקו אור. בכל חדר מחכה משהו קטן שאפשר לעשות—וביחד, הדברים הקטנים האלה עושים הבדל.', 'Step inside. Wander around. Turn on a light. There’s a little something to do in every room. Together, those little things make a difference.')}</p>
            {room ? <div className={`td-room-quest ${completed ? 'is-complete' : ''}`}>
              <div className="td-room-quest-top">
                <span className="td-room-quest-emoji">{completed ? <Check size={24} /> : room.emoji}</span>
                <span>
                  <small>{say('הניצחון הקטן שלכם', 'YOUR LITTLE WIN')}</small>
                  <strong>{he ? quest.he : quest.en}</strong>
                </span>
                <b>+{quest.points}<Zap size={11} />
                </b>
              </div>
              <button onClick={complete} disabled={completed}>{completed ? <>
                <Check size={16} />{say('עשינו משהו טוב', 'A little good, done')}</> : <>{he ? room.actionHe : room.actionEn}<Arrow size={16} />
              </>}</button>
              <p>{completed ? (he ? room.doneHe : room.doneEn) : (he ? room.tipHe : room.tipEn)}</p>
              {completed && <button className="td-quest-replay" onClick={() => { setTour(false); setReplay(value => ({ id: quest.id, nonce: (value?.nonce || 0) + 1 })); }}>
                <Play size={10} />{say('עוד פעם, בשביל הסיפוק', 'Once more, just for the joy')}</button>}
            </div> : <>
              <div className="td-home-progress">
                <div>
                  <span className="td-home-progress-icon">
                    <Sparkles size={21} />
                  </span>
                  <div>
                    <strong>{totalDone === 3 ? say('הבית אומר תודה.', 'Home says thank you.') : say('שלושה חדרים. שלושה ניצחונות.', 'Three rooms. Three little wins.')}</strong>
                    <small>{say(`${totalDone} מתוך 3 משימות בסיור הושלמו`, `${totalDone} of 3 house quests complete`)}</small>
                  </div>
                </div>
                <span className="td-home-progress-track">
                  <i style={{ width: `${totalDone / 3 * 100}%` }} />
                </span>
              </div>
              <button className="td-enter-first" onClick={() => visit('kitchen')}>{say('נתחיל במטבח', 'Start in the kitchen')}<Arrow size={19} />
              </button>
            </>}
            <div className="td-story-notice" role="status" aria-live="polite">{announcement}</div>
          </div>
          <div className="td-story-bottom">
            <button className="td-guided-toggle" aria-pressed={tour} onClick={() => { setExploded(false); if (!tour && view === 'home') setView('kitchen'); setTour(!tour); }}>{tour ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}{tour ? say('עוצרים רגע', 'Pause the tour') : say('קחו אותי לסיבוב', 'Take me on a tour')}</button>
            <div className="td-story-pagination">
              <button onClick={previous} disabled={view === 'home'} aria-label={say('החדר הקודם', 'Previous room')}>{he ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
              <span>{room ? `${room.number} / 03` : '00 / 03'}</span>
              <button onClick={next} aria-label={say('החדר הבא', 'Next room')}>{he ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}</button>
            </div>
          </div>
          <p className="td-journey-disclaimer">{say('בית לדוגמה. הנקודות עוברות למשחק ההדגמה שלכם.', 'A sample home. Your points carry into the playground.')}</p>
        </aside>
      </div>
    </div>
  </dialog>;
}
