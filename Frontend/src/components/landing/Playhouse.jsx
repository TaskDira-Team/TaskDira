import { useEffect, useRef, useState } from 'react';
import { Bookmark, ArrowLeft, ArrowRight, Check, Clock3, Flame, Gift, Home, RotateCcw, Sparkles, Star, Trophy, X, Zap } from 'lucide-react';
import { balance, completeQuest, DEMO_STORAGE_KEY, earnedPoints, initialDemo, QUESTS, REWARDS, redeemReward, validDemo } from './demoState';

import useSavedChores from '../../hooks/useSavedChores';

export default function Playhouse({ he }) {
  const saved = useSavedChores('demo', 'sunshine');
  const savedQuests = QUESTS.filter(quest => saved.isSaved(quest.id));
  const say = (h, e) => he ? h : e;
  const [state, setState] = useState(() => { try { return validDemo(JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY))); } catch { return initialDemo(); } });
  const [tab, setTab] = useState('tasks');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [resetting, setResetting] = useState(false);
  const dialog = useRef(null);
  const lastFocus = useRef(null);
  const current = useRef(state);
  const Arrow = he ? ArrowLeft : ArrowRight;
  useEffect(() => { try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); } catch { /* The playground also works without storage. */ } }, [state]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 4500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (celebration) { lastFocus.current = document.activeElement; dialog.current?.showModal(); } }, [celebration]);
  const update = next => { current.current = next; setState(next); };
  const celebrate = async (origin = { x: 0.5, y: 0.65 }) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-stop-animations')) return;
    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({ particleCount: 65, spread: 65, origin, colors: ['#dd5736', '#d4df8d', '#f2c35d', '#9baec4'], disableForReducedMotion: true });
    } catch { /* A cosmetic animation must never interrupt a completed quest. */ }
  };
  const complete = (quest, event) => {
    const next = completeQuest(current.current, quest.id);
    if (next === current.current) return;
    update(next);
    setNotice({ he: `איזה כיף! עוד ${quest.points} נקודות בדרך לפרס.`, en: `Nice one! ${quest.points} points closer to your next reward.` });
    const box = event.currentTarget.getBoundingClientRect();
    celebrate({ x: (box.x + box.width / 2) / window.innerWidth, y: (box.y + box.height / 2) / window.innerHeight });
  };
  const redeem = reward => { const next = redeemReward(current.current, reward.id); if (next === current.current) return; update(next); setCelebration(reward); celebrate(); };
  const closeCelebration = () => { dialog.current?.close(); setCelebration(null); lastFocus.current?.focus(); };
  const points = balance(state);
  const xp = earnedPoints(state);
  const tabs = [['tasks', Home, say('המשימות שלנו', 'Our quests')], ['rewards', Gift, say('חנות הפרסים', 'Reward shop')], ['family', Trophy, say('הקבוצה שלנו', 'Our team')]];
  const taskList = QUESTS.filter(q => filter === 'all' || (filter === 'saved' ? saved.isSaved(q.id) : filter === 'done' ? state.completed.includes(q.id) : !state.completed.includes(q.id)));
  const members = [{ name: say('נועם', 'Noam'), emoji: '🧑🏽', points: 180 + xp, you: true }, { name: say('מאיה', 'Maya'), emoji: '👧🏻', points: 265 }, { name: say('אמא', 'Mom'), emoji: '👩🏻', points: 240 }, { name: say('אבא', 'Dad'), emoji: '👨🏻', points: 195 }].sort((a, b) => b.points - a.points);
  const changeTab = next => { setTab(next); setResetting(false); };
  return <div className="td-playhouse" data-reveal>
    <div className="td-app-bar">
      <div className="td-app-address">
        <span className="td-app-icon">
          <Home size={16} />
        </span>
        <strong>{say('הבית של משפחת שמש', 'The Sunshine household')}</strong>
        <span className="td-demo-chip">{say('דמו אינטראקטיבי', 'INTERACTIVE DEMO')}</span>
      </div>
      <div className="td-window-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
    <div className="td-app-layout">
      <aside className="td-app-sidebar">
        <div className="td-sidebar-label">{say('המקום שלנו', 'OUR LITTLE WORLD')}</div>
        <nav aria-label={say('מסכי ההדגמה', 'Demo screens')}>{tabs.map(([id, Icon, label]) => <button key={id} className={tab === id ? 'is-selected' : ''} onClick={() => changeTab(id)} aria-pressed={tab === id}>
          <Icon size={19} />
          <span>{label}</span>{id === 'tasks' && <small>{QUESTS.length - state.completed.length}</small>}</button>)}</nav>
        <div className="td-saved-shelf">
          <div className="td-saved-heading">
            <Bookmark size={15} />
            <strong>{say('שמרתי לאחר כך', 'Saved for later')}</strong>
            <span>{savedQuests.length}</span>
          </div>
          {savedQuests.length ? <div className="td-saved-items">{savedQuests.map(quest => <button key={quest.id} onClick={() => { changeTab('tasks'); setFilter('saved'); }}>
            <span>{quest.emoji}</span>
            <strong>{he ? quest.he : quest.en}</strong>{state.completed.includes(quest.id) && <Check size={12} />}</button>)}</div> : <p>{say('לחצו על סימניית המשימה כדי לשמור אותה קרוב.', 'Tap a quest’s bookmark to keep it close.')}</p>}
          <small>{say('נשמר בדפדפן הזה', 'Saved in this browser')}</small>
        </div>
        <div className="td-sidebar-bottom">
          <div className="td-sidebar-note">
            <Sparkles size={18} />
            <p>{say('הדברים הקטנים שאתם עושים? הם עושים הבדל גדול.', 'The little things you do? They make a big difference.')}</p>
          </div>
          <div className="td-sidebar-user">
            <span>🧑🏽</span>
            <div>
              <strong>{say('נועם שמש', 'Noam Sunshine')}</strong>
              <small>{say('גיבור הבית · רמה 8', 'Home hero · Level 8')}</small>
            </div>
            <span className="td-online" />
          </div>
        </div>
      </aside>
      <div className="td-app-main">
        <div className="td-app-welcome">
          <div>
            <span className="td-app-date">{say('יום חדש, הזדמנויות קטנות', 'A NEW DAY, A FEW LITTLE WINS')}</span>
            <h3>{tab === 'tasks' ? say('היי נועם, מה עושים היום?', 'Hey Noam, what’s the plan?') : tab === 'rewards' ? say('עבדתם בשביל זה. תהנו.', 'You earned this. Enjoy it.') : say('ביחד, הבית מנצח.', 'Together, home wins.')} <span>{tab === 'tasks' ? '☀️' : tab === 'rewards' ? '✨' : '🏆'}</span>
            </h3>
          </div>
          <button className="td-reset" onClick={() => setResetting(!resetting)} aria-label={say('איפוס ההדגמה', 'Reset playground')} title={say('איפוס ההדגמה', 'Reset playground')}>
            <RotateCcw size={16} />
          </button>
        </div>
        {resetting && <div className="td-reset-confirm">
          <span>{say('להתחיל את ההדגמה מחדש?', 'Start the playground again?')}</span>
          <button onClick={() => { update(initialDemo()); saved.clear(); setFilter('all'); setResetting(false); setNotice(null); }}>{say('כן, מתחילים מחדש', 'Yes, start fresh')}</button>
          <button onClick={() => setResetting(false)}>{say('ביטול', 'Cancel')}</button>
        </div>}
        <div className="td-app-stats">
          <div>
            <span className="td-stat-icon td-icon-orange">
              <Zap size={19} />
            </span>
            <span>
              <small>{say('הנקודות שלי', 'MY POINTS')}</small>
              <strong data-testid="demo-balance">{points}<span>XP</span>
              </strong>
            </span>
            <i>↗</i>
          </div>
          <div>
            <span className="td-stat-icon td-icon-green">
              <Check size={19} />
            </span>
            <span>
              <small>{say('משימות שהושלמו', 'QUESTS COMPLETED')}</small>
              <strong>{state.completed.length}<span>/ 4</span>
              </strong>
            </span>
          </div>
          <div>
            <span className="td-stat-icon td-icon-yellow">
              <Flame size={19} />
            </span>
            <span>
              <small>{say('הרצף של נועם', 'NOAM’S STREAK')}</small>
              <strong>7<span>{say('ימים', 'days')}</span>
              </strong>
            </span>
          </div>
        </div>
        <div className="td-app-content" key={tab}>
          {tab === 'tasks' && <>
            <div className="td-task-list-head">
              <h4>{say('ניצחונות קטנים להיום', 'Today’s little wins')}</h4>
              <div className="td-task-filters" aria-label={say('סינון משימות', 'Filter quests')}>{[['all', say('הכול', 'All')], ['open', say('לביצוע', 'To do')], ['done', say('בוצעו', 'Done')], ['saved', say('שמורות', 'Saved')]].map(([id, text]) => <button key={id} onClick={() => setFilter(id)} className={filter === id ? 'is-active' : ''} aria-pressed={filter === id}>{text}</button>)}</div>
            </div>
            <div className="td-task-list">{taskList.length === 0 ? <div className="td-empty">
              <Sparkles />
              <strong>{filter === 'saved' ? say('מקום קטן למשימות שלכם', 'A little space for your quests') : filter === 'done' ? say('הניצחון הראשון מחכה לכם', 'Your first win is waiting') : say('הכול מאחוריכם. כל הכבוד!', 'All done. Look at you go!')}</strong>
              <p>{filter === 'saved' ? say('שמרו משימה בלחיצה על הסימנייה.', 'Bookmark a quest to find it here.') : filter === 'done' ? say('השלימו משימה והיא תופיע כאן.', 'Complete a quest and it will appear here.') : say('זה הזמן להציץ בחנות הפרסים.', 'Time to check out the reward shop.')}</p>
            </div> : taskList.map(quest => {
              const done = state.completed.includes(quest.id); return <div className={`td-task-row ${done ? 'is-done' : ''}`} key={quest.id}>
                <span className={`td-task-emoji td-emoji-${quest.id}`}>{quest.emoji}</span>
                <div className="td-task-title">
                  <strong>{he ? quest.he : quest.en}</strong>
                  <small>{he ? quest.categoryHe : quest.categoryEn}<span>·</span>
                    <Clock3 size={11} />{quest.minutes} {say('דק׳', 'min')}</small>
                </div>
                <span className="td-task-xp" dir="ltr">+{quest.points} <Star size={12} fill="currentColor" />
                </span>
                <button className="td-bookmark" aria-pressed={saved.isSaved(quest.id)} onClick={() => saved.toggle(quest.id)} aria-label={`${saved.isSaved(quest.id) ? say('ביטול שמירה', 'Unsave quest') : say('שמירה לאחר כך', 'Save quest')}: ${he ? quest.he : quest.en}`}>
                  <Bookmark size={16} fill={saved.isSaved(quest.id) ? 'currentColor' : 'none'} />
                </button>
                <button className="td-complete" disabled={done} onClick={event => complete(quest, event)} aria-label={`${say('השלמת המשימה', 'Complete quest')}: ${he ? quest.he : quest.en}`}>
                  <Check size={16} />
                  <span>{done ? say('בוצע!', 'Done!') : say('עשיתי!', 'Did it!')}</span>
                </button>
              </div>;
            })}</div>
            <div className="td-next-reward">
              <span>🍕</span>
              <div>
                <strong>{state.redeemed.includes('pizza') ? say('ערב הפיצה שלכם בדרך!', 'Pizza night is yours!') : say('הרגע המשפחתי הבא כבר קרוב', 'Your next family moment is close')}</strong>
                <small>{state.redeemed.includes('pizza') ? say('אולי הגיע הזמן לבחור סרט?', 'How about choosing a movie next?') : points >= 250 ? say('יש מספיק נקודות לערב פיצה!', 'You have enough points for pizza night!') : say(`עוד ${250 - points} נקודות לערב פיצה משפחתי`, `${250 - points} points until family pizza night`)}</small>
              </div>
              <button onClick={() => changeTab('rewards')}>{say('לחנות', 'Shop')}<Arrow size={14} />
              </button>
            </div>
          </>}
          {tab === 'rewards' && <>
            <div className="td-task-list-head">
              <h4>{say('דברים טובים שמחכים לכם', 'Good things are waiting')}</h4>
              <span className="td-rewards-budget">{points} {say('נקודות לבזבז', 'points to spend')}</span>
            </div>
            <div className="td-shop-grid">{REWARDS.map(reward => {
              const claimed = state.redeemed.includes(reward.id); const eligible = points >= reward.cost; return <article key={reward.id} className={`td-shop-item td-shop-${reward.color}`}>
                <div className="td-shop-art">{reward.emoji}<span aria-hidden="true">✦</span>
                </div>
                <h5>{he ? reward.he : reward.en}</h5>
                <p>{he ? reward.subHe : reward.subEn}</p>
                <strong className="td-shop-price">{reward.cost}<Star size={13} fill="currentColor" />
                </strong>
                <button disabled={claimed || !eligible} onClick={() => redeem(reward)}>{claimed ? <>
                  <Check size={15} />{say('הפרס שלכם!', 'It’s yours!')}</> : eligible ? say('זה הפרס שלי', 'Claim my reward') : say(`חסרות ${reward.cost - points} נקודות`, `${reward.cost - points} more points`)}</button>
              </article>;
            })}</div>
          </>}
          {tab === 'family' && <>
            <div className="td-task-list-head">
              <h4>{say('כל אחד תורם, כולם מרוויחים', 'Everyone contributes. Everyone wins.')}</h4>
              <span className="td-rewards-budget">{say('משפחה לדוגמה', 'Example family')}</span>
            </div>
            <div className="td-team-list">{members.map((member, i) => <div key={member.name} className={member.you ? 'is-you' : ''}>
              <span className="td-rank">{i === 0 ? <Trophy size={19} /> : `0${i + 1}`}</span>
              <span className="td-team-avatar">{member.emoji}</span>
              <strong>{member.name}{member.you && <small>{say('זה אתם', 'YOU')}</small>}</strong>
              <div className="td-team-track">
                <i style={{ width: `${member.points / 310 * 100}%` }} />
              </div>
              <b dir="ltr">{member.points}<span> XP</span>
              </b>
            </div>)}</div>
            <div className="td-team-note">
              <span aria-hidden="true">♡</span>{say('הנקודות כאן מצטברות מהמשימות. פרסים לא מורידים את הדירוג שלכם.', 'Your rank reflects effort. Spending points on rewards won’t lower it.')}</div>
          </>}
        </div>
        <div className={`td-demo-notice ${notice ? 'is-visible' : ''}`} role="status" aria-live="polite">
          <span>{notice && <>
            <Check size={16} />{he ? notice.he : notice.en}</>}</span>
        </div>
      </div>
    </div>
    <dialog className="td-celebration" ref={dialog} onCancel={event => { event.preventDefault(); closeCelebration(); }} onClick={event => { if (event.target === dialog.current) closeCelebration(); }} aria-labelledby="td-celebration-title">
      <button className="td-dialog-close" onClick={closeCelebration} aria-label={say('סגירה', 'Close')}>
        <X size={20} />
      </button>
      <div className="td-celebration-emoji">{celebration?.emoji}</div>
      <span className="td-kicker">{say('עוד רגע טוב, בזכותכם', 'A LITTLE GOOD, EARNED BY YOU')}</span>
      <h3 id="td-celebration-title">{say('זה לגמרי שלכם!', 'You’ve earned it!')}</h3>
      <p>{celebration && (he ? celebration.he : celebration.en)}</p>
      <span className="td-celebration-note">{say('הפרס מומש במשחק ההדגמה. בחיים האמיתיים, אתם קובעים מתי חוגגים.', 'Reward claimed in the demo. In real life, your family decides when to celebrate.')}</span>
      <button className="td-btn td-btn-orange" onClick={closeCelebration} autoFocus>{say('ממשיכים לעשות טוב', 'Keep the good going')}<Arrow size={17} />
      </button>
    </dialog>
  </div>;
}
