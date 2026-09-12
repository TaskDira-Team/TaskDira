import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Flame, Gift, Globe2, Heart, Home, Menu, Play, Plus, ShieldCheck, Sparkles, Star, Trophy, Users, X, Zap } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useRoute } from '../context/RouteContext';
import Playhouse from '../components/landing/Playhouse';
import HouseExplorer from '../components/landing/HouseExplorer';
import NarratedTour from '../components/landing/NarratedTour';
import '../components/landing/landing.css';
import '../components/landing/houseJourney.css';

export function Brand({ onClick }) {
  return <button className="td-brand" onClick={onClick} aria-label="TaskDira">
    <span className="td-brand-mark">
      <Home size={23} strokeWidth={2.5} />
      <span />
    </span>
    <span dir="ltr">TaskDira<span className="td-brand-dot">.</span>
    </span>
  </button>;
}

export default function Landing() {
  const { lang, dir, toggleLang } = useI18n();
  const { navigate } = useRoute();
  const he = lang === 'he';
  const say = (h, e) => he ? h : e;
  const [menu, setMenu] = useState(false);
  const [activeRoom, setActiveRoom] = useState('kitchen');
  const root = useRef(null);
  const Arrow = he ? ArrowLeft : ArrowRight;
  const go = id => {
    setMenu(false);
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    target?.focus({ preventScroll: true });
  };
  const signup = () => navigate('/register');
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('td-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    root.current.querySelectorAll('[data-reveal]').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  const rooms = {
    kitchen: { title: say('לפנות את המדיח', 'Empty the dishwasher'), points: 30, emoji: '🍽️', name: say('המטבח', 'Kitchen') },
    bedroom: { title: say('לסדר את המיטה', 'Make the bed'), points: 20, emoji: '🛏️', name: say('חדר השינה', 'Bedroom') },
    living: { title: say('להשקות את העציצים', 'Water the plants'), points: 25, emoji: '🪴', name: say('הסלון', 'Living room') },
  };
  const room = rooms[activeRoom];
  const nav = [['how', say('איך זה עובד', 'How it works')], ['play', say('בואו לשחק', 'Try it out')], ['features', say('מה בפנים', 'The good stuff')], ['questions', say('שאלות טובות', 'Good questions')]];
  return <div className="td-site" dir={dir} ref={root}>
    <button className="td-skip" onClick={() => go('main')}>{say('דילוג לתוכן', 'Skip to content')}</button>
    <header className="td-header">
      <div className="td-container td-nav">
        <Brand onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <nav className="td-nav-links" aria-label={say('ניווט ראשי', 'Main navigation')}>{nav.map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}</button>)}</nav>
        <div className="td-nav-actions">
          <button className="td-lang" onClick={toggleLang} aria-label={say('Switch to English', 'מעבר לעברית')}>
            <Globe2 size={16} />
            <span>{he ? 'EN' : 'עב'}</span>
          </button>
          <button className="td-login" onClick={() => navigate('/login')}>{say('כניסה', 'Log in')}</button>
          <button className="td-btn td-btn-dark td-nav-cta" onClick={signup}>{say('מתחילים ביחד', 'Get started')}<Arrow size={15} />
          </button>
          <button className="td-menu-button" aria-label={say('תפריט ניווט', 'Navigation menu')} aria-expanded={menu} aria-controls="td-mobile-menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        </div>
      </div>{menu && <nav className="td-mobile-menu" id="td-mobile-menu" aria-label={say('ניווט לנייד', 'Mobile navigation')}>{nav.map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}<Arrow size={18} />
      </button>)}</nav>}</header>
    <main id="main" tabIndex={-1}>
      <section className="td-hero td-container" aria-labelledby="hero-title">
        <div className="td-hero-copy">
          <div className="td-eyebrow">
            <span className="td-live-dot" />{say('קצת סדר. הרבה יותר ביחד.', 'A little tidier. A lot more together.')}</div>
          <h1 id="hero-title">{say('אותו בית.', 'Same home.')}<br />
            <span className="td-orange td-hero-underline">{say('משחק חדש.', 'New game.')}<svg viewBox="0 0 440 25" aria-hidden="true">
              <path d="M5 17 Q 215 -4 431 12 M85 23 Q265 9 402 20" />
            </svg>
            </span>
            <span className="td-headline-spark" aria-hidden="true">✳</span>
          </h1>
          <p className="td-hero-description">{say('מי אמר שמטלות חייבות להיות מטלות?', 'Who said chores have to feel like chores?')}<br />{say('הופכים את הדברים הקטנים של הבית למשימות, נקודות ופרסים שכל המשפחה מרוויחה מהם.', 'Turn the little things around the house into quests, points, and rewards the whole family can get behind.')}</p>
          <div className="td-hero-actions">
            <button className="td-btn td-btn-orange" onClick={signup}>{say('בואו נתחיל לשחק', 'Let’s play together')}<Arrow size={20} />
            </button>
            <button className="td-demo-button" onClick={() => go('play')}>
              <span className="td-play-icon">
                <Play size={14} fill="currentColor" />
              </span>{say('רגע, תראו לי איך', 'Show me how')}</button>
          </div>
          <div className="td-hero-fine">
            <Check size={14} />{say('כל המשפחה במקום אחד', 'One place for the whole family')}<span>·</span>{say('גם הכביסה מקבלת משמעות', 'Even laundry gets a purpose')}</div>
          <div className="td-hero-family">
            <div className="td-avatar-stack" aria-hidden="true">
              <span>👩🏻</span>
              <span>🧑🏽</span>
              <span>👧🏻</span>
              <span>🧒🏽</span>
            </div>
            <div>
              <strong>{say('קבוצה אחת. הבית שלכם.', 'One team. Your home.')}</strong>
              <span>{say('להורים, לילדים ולכל מי שחולק בית.', 'For parents, kids, and everyone sharing a home.')}</span>
            </div>
            <Heart size={23} className="td-family-heart" />
          </div>
        </div>
        <div className="td-house-scene">
          <div className="td-scene-orbit" aria-hidden="true" />
          <span className="td-scene-label" dir="ltr">A LITTLE WORLD. A BIG DIFFERENCE.</span>
          <HouseExplorer he={he} activeRoom={activeRoom} onRoomChange={setActiveRoom} />
          <div className="td-float td-float-streak">
            <span className="td-streak-icon">
              <Flame fill="currentColor" size={24} />
            </span>
            <div>
              <strong>{say('7 ימים של ביחד', '7 days of teamwork')}</strong>
              <span>{say('ככה נולד הרגל טוב', 'That’s how a good habit starts')}</span>
            </div>
            <span className="td-tiny-spark">✦</span>
          </div>
          <div className="td-room-pins" aria-label={say('גלו משימות לפי חדר', 'Explore room quests')}>{Object.entries(rooms).map(([id, item]) => <button key={id} className={`td-room-pin td-pin-${id} ${activeRoom === id ? 'is-active' : ''}`} aria-label={item.name} aria-pressed={activeRoom === id} onClick={() => setActiveRoom(id)}>
            <Plus size={17} />
          </button>)}</div>
          <button className="td-float td-quest-card" onClick={() => go('play')} aria-label={say('נסו להשלים משימה בהדגמה', 'Try completing a demo quest')}>
            <span className="td-quest-emoji">{room.emoji}</span>
            <div>
              <small>{say('המשימה הבאה שלכם', 'Your next little win')}</small>
              <strong key={activeRoom}>{room.title}</strong>
            </div>
            <span className="td-points" dir="ltr">+{room.points}<small>XP</small>
            </span>
            <span className="td-quest-check">
              <Check size={15} />
            </span>
          </button>
          <div className="td-level-sticker">
            <Star fill="currentColor" size={19} />
            <span>{say('בית ברמה אחרת', 'HOME, LEVELED UP')}</span>
          </div>
          <div className="td-scene-caption">
            <span className="td-caption-line" />{say('כל חדר הוא התחלה של משהו טוב', 'A little good in every room')}<span aria-hidden="true">↗</span>
          </div>
        </div>
      </section>
      <div className="td-values-strip">
        <div className="td-container">{[[Users, say('כולם חלק מהמשחק', 'Everyone gets to play')], [Zap, say('כל משימה היא ניצחון קטן', 'Every task is a little win')], [Gift, say('פרסים שאתם בוחרים', 'Rewards you actually want')], [Heart, say('יותר זמן לדברים החשובים', 'More time for what matters')]].map(([Icon, text]) => <div key={text}>
          <Icon size={20} />
          <span>{text}</span>
          <span className="td-strip-star" aria-hidden="true">✳</span>
        </div>)}</div>
      </div>
      <section className="td-section td-container" id="how" tabIndex={-1}>
        <div className="td-section-heading" data-reveal>
          <div>
            <span className="td-kicker">01 / {say('פשוט להיכנס למשחק', 'A SIMPLE START')}</span>
            <h2>{say('פחות ״מי עושה?״.', 'Less “whose turn?”')}<br />
              <span className="td-muted-heading">{say('יותר ״אני על זה״.', 'More “I’ve got this.”')}</span>
            </h2>
          </div>
          <p>{say('לא עוד רשימה על המקרר. דרך חדשה לעשות את זה ביחד — בשלושה צעדים קטנים.', 'More than a list on the fridge. A new way to do life together, in three small steps.')}</p>
        </div>
        <div className="td-steps">{[
          {
            n: '01', icon: <Home />, title: say('מקימים את הבית', 'Make yourself at home'), text: say('נותנים לו שם, בוחרים אווטאר ומזמינים את האנשים שהופכים אותו לבית.', 'Give it a name, choose an avatar, and invite the people who make it home.'), art: <div className="td-step-family">
              <span>👩🏻</span>
              <span>👧🏻</span>
              <span>🧑🏽</span>
              <span>+</span>
            </div>
          },
          {
            n: '02', icon: <Check />, title: say('הופכים מטלות למשימות', 'Give chores a plot twist'), text: say('משייכים משימות, קובעים ניקוד ונותנים לכל אחד הזדמנות לקחת חלק.', 'Assign quests, set the points, and give everyone a chance to contribute.'), art: <div className="td-step-task">
              <span className="td-mini-check">
                <Check size={13} />
              </span>
              <span>{say('להוציא את הכלב', 'Walk the dog')}</span>
              <b dir="ltr">+25 XP</b>
            </div>
          },
          {
            n: '03', icon: <Gift />, title: say('מרוויחים רגעים ביחד', 'Earn more of the good stuff'), text: say('צוברים נקודות ופותחים פרסים שבאמת רוצים. ערב פיצה, למשל.', 'Collect points and unlock things you actually look forward to. Pizza night, anyone?'), art: <div className="td-step-reward">
              <span>🍕</span>
              <div>
                <b>{say('ערב פיצה משפחתי', 'Family pizza night')}</b>
                <span className="td-mini-track">
                  <i />
                </span>
              </div>
              <Sparkles size={19} />
            </div>
          },
        ].map(step => <article className="td-step" key={step.n} data-reveal>
          <div className="td-step-top">
            <span className="td-step-icon">{step.icon}</span>
            <span>{step.n}</span>
          </div>{step.art}<h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>)}</div>
      </section>
      <section className="td-play-section" id="play" tabIndex={-1}>
        <div className="td-container">
          <div className="td-section-heading td-play-heading" data-reveal>
            <div>
              <span className="td-kicker">02 / {say('מספיק לדבר. בואו לשחק.', 'LESS TALK. MORE PLAY.')}</span>
              <h2>{say('הבית שלכם.', 'Your home.')} <span>{say('אבל בכיף.', 'With a little more fun.')}</span>
              </h2>
            </div>
            <p>{say('קחו את זה לסיבוב. השלימו משימה, הרוויחו נקודות וגלו מה מחכה לכם בחנות.', 'Take it for a spin. Complete a quest, earn points, and see what’s waiting in the reward shop.')}</p>
          </div>
          <Playhouse he={he} />
          <div className="td-demo-footnote">
            <ShieldCheck size={15} />{say('סביבת משחק לדוגמה · בלי הרשמה · ההתקדמות נשמרת רק בדפדפן הזה', 'A demo playground · No sign-up · Progress stays in this browser')}</div>
        </div>
      </section>
      <section className="td-section td-container" id="features" tabIndex={-1}>
        <div className="td-section-heading" data-reveal>
          <div>
            <span className="td-kicker">03 / {say('דברים קטנים. הבדל גדול.', 'SMALL THINGS. BIG DIFFERENCE.')}</span>
            <h2>{say('קצת קסם', 'A little magic')}<br />
              <span className="td-muted-heading">{say('ביום־יום שלכם.', 'in your everyday.')}</span>
            </h2>
          </div>
          <p>{say('כל מה שצריך כדי להפוך את ״צריך לעשות״ ל״כבר עשיתי״.', 'Everything you need to turn “someone should” into “already done.”')}</p>
        </div>
        <div className="td-bento">
          <article className="td-bento-card td-bento-rewards" data-reveal>
            <div>
              <span className="td-feature-icon">
                <Gift />
              </span>
              <h3>{say('הפרס? אתם מחליטים.', 'The reward? You decide.')}</h3>
              <p>{say('זמן מסך, בילוי משותף או הזכות לבחור את הסרט. בונים חנות קטנה של דברים שעושים לכם טוב.', 'Screen time, a day out, or picking the movie. Make your own little shop of things worth doing chores for.')}</p>
              <button className="td-text-link" onClick={() => go('play')}>{say('תנו לי להציץ', 'Let me have a look')}<Arrow size={17} />
              </button>
            </div>
            <div className="td-reward-illustration" aria-hidden="true">
              <span className="td-orbit-star">✦</span>
              <div className="td-reward-ticket">
                <span className="td-ticket-small">GOOD TIMES CLUB</span>
                <span className="td-ticket-emoji">🍕</span>
                <strong>{say('ערב פיצה!', 'Pizza night!')}</strong>
                <div className="td-ticket-rule" />
                <span dir="ltr">250 <Star size={13} fill="currentColor" />
                </span>
              </div>
              <div className="td-reward-ticket td-ticket-back">
                <span>🎬</span>
              </div>
              <span className="td-illustration-spark">✳</span>
            </div>
          </article>
          <article className="td-bento-card td-bento-streak" data-reveal>
            <span className="td-feature-icon">
              <Flame />
            </span>
            <h3>{say('יום ועוד יום. ופתאום, הרגל.', 'Day by day. Then, a habit.')}</h3>
            <p>{say('רצפים קטנים ששומרים על המומנטום. כי התמדה ראויה לרגע של גאווה.', 'A little streak to keep the momentum going. Showing up deserves its own little celebration.')}</p>
            <div className="td-streak-art">
              <Flame size={64} strokeWidth={1.4} fill="currentColor" />
              <strong>7<span>{say('ימים ברצף', 'day streak')}</span>
              </strong>
            </div>
            <div className="td-week">{(he ? ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map((day, i) => <div key={i}>
              <span>{day}</span>
              <i>{i === 6 ? <Flame size={16} fill="currentColor" /> : <Check size={14} />}</i>
            </div>)}</div>
          </article>
          <article className="td-bento-card td-bento-team" data-reveal>
            <div>
              <span className="td-feature-icon">
                <Users />
              </span>
              <h3>{say('קצת תחרות. המון אהבה.', 'A little rivalry. A lot of love.')}</h3>
              <p>{say('לוח משפחתי שמפרגן למאמץ של כולם. כל אחד מתקדם בקצב שלו, והבית מרוויח.', 'A family board that gives everyone’s effort a moment in the spotlight.')}</p>
            </div>
            <div className="td-podium" aria-label={say('דוגמה ללוח מנצחים משפחתי', 'Example family leaderboard')}>
              <div>
                <span>👧🏻</span>
                <i>2</i>
              </div>
              <div>
                <Trophy size={20} />
                <span>🧑🏽</span>
                <i>1</i>
              </div>
              <div>
                <span>👩🏻</span>
                <i>3</i>
              </div>
            </div>
          </article>
          <article className="td-bento-card td-bento-progress" data-reveal>
            <div>
              <span className="td-feature-icon">
                <Sparkles />
              </span>
              <h3>{say('רואים את הדרך שעשיתם.', 'Look how far you’ve come.')}</h3>
              <p>{say('נקודות, רמות והישגים. כל משימה קטנה הופכת לחלק מסיפור גדול יותר.', 'Points, levels, and achievements. Every small task becomes part of something bigger.')}</p>
            </div>
            <div className="td-progress-art">
              <span className="td-medal">
                <Star size={32} fill="currentColor" />
              </span>
              <div>
                <small>{say('השלב הבא כבר קרוב', 'Your next level is close')}</small>
                <strong>{say('אלופי הבית', 'Home heroes')} <span>LV. 08</span>
                </strong>
                <div className="td-progress-line">
                  <i />
                </div>
                <span className="td-progress-numbers" dir="ltr">840 / 1,000 XP</span>
              </div>
            </div>
          </article>
        </div>
      </section>
      <section className="td-manifesto">
        <div className="td-container" data-reveal>
          <span className="td-kicker">{say('הבית הוא לא רשימת משימות', 'HOME IS MORE THAN A TO-DO LIST')}</span>
          <h2>{say('בסוף, זה לא רק בית מסודר.', 'In the end, it’s more than a tidy home.')}<br />{say('זה יותר מקום', 'It’s more room')} <span>{say('להיות ביחד.', 'to be together.')}</span>
            <Heart aria-hidden="true" />
          </h2>
          <p>{say('פחות להזכיר. יותר להעריך. פחות לנהל את כולם. יותר להיות משפחה.', 'Less reminding. More appreciating. Less managing everyone. More being a family.')}</p>
          <div className="td-manifesto-avatars" aria-hidden="true">
            <span>👩🏻</span>
            <span>🧒🏽</span>
            <span>👧🏻</span>
            <span>🧑🏽</span>
            <span>🐶</span>
          </div>
        </div>
      </section>
      <section className="td-section td-container td-faq" id="questions" tabIndex={-1}>
        <div data-reveal>
          <span className="td-kicker">04 / {say('טוב ששאלתם', 'GLAD YOU ASKED')}</span>
          <h2>{say('עוד משהו', 'A few things')}<br />
            <span className="td-muted-heading">{say('קטן לפני?', 'before you start?')}</span>
          </h2>
          <p>{say('כל הדברים שאולי עברו לכם בראש.', 'The things you might be wondering.')}</p>
        </div>
        <div className="td-faq-list" data-reveal>{[
          [say('זה מתאים גם לילדים קטנים?', 'Can younger kids take part?'), say('כן. אפשר ליצור משימות קטנות שמתאימות לגיל, לבחור יחד אווטאר ולהגדיר פרסים שהילדים אוהבים. המבוגרים מנהלים את המשימות ואת הבית.', 'Yes. Create age-appropriate tasks, choose an avatar together, and set rewards your kids love. Adults manage the household and its quests.')],
          [say('ומה אם אנחנו שותפים ולא משפחה?', 'What if we’re roommates?'), say('גם שותפים, זוגות וכל מי שחולק בית יכולים לשחק. מקימים בית, מזמינים את האנשים שלכם ומחלקים את המשימות בדרך שמתאימה לכם.', 'Roommates, couples, and anyone sharing a home can play. Create a household, invite your people, and share the tasks your way.')],
          [say('מי קובע את המשימות והפרסים?', 'Who chooses the quests and rewards?'), say('אתם. מנהלי הבית יוצרים משימות, קובעים ניקוד ומוסיפים פרסים. כל בית יכול לבנות משחק שמתאים להרגלים ולשגרה שלו.', 'You do. Household admins create tasks, assign points, and add rewards. Every home can build a game that fits its routine.')],
          [say('צריך להוריד אפליקציה?', 'Do I need to download an app?'), say('לא צריך. נכנסים דרך הדפדפן בטלפון, בטאבלט או במחשב. אפשר להתחיל עם ההדגמה כאן בעמוד, בלי להירשם.', 'No download needed. Open TaskDira in your phone, tablet, or desktop browser. Try the playground here without signing up.')],
          [say('הדמו משנה משהו בבית שלי?', 'Does the demo affect my household?'), say('לא. ההדגמה משתמשת במשפחה ובמשימות לדוגמה. הנקודות והפרסים שלה נשמרים רק בדפדפן הזה ואינם מחוברים לחשבון שלכם.', 'No. The playground uses an example family and quests. Its points and rewards stay in this browser and aren’t connected to your account.')],
        ].map(([question, answer]) => <details key={question}>
          <summary>{question}<Plus size={19} />
          </summary>
          <p>{answer}</p>
        </details>)}</div>
      </section>
      <section className="td-final-wrap td-container">
        <div className="td-final-cta" data-reveal>
          <div className="td-final-spark" aria-hidden="true">✳</div>
          <span className="td-kicker">{say('המשימה הראשונה? פשוט להתחיל.', 'YOUR FIRST QUEST? JUST GET STARTED.')}</span>
          <h2>{say('הבית נשאר שלכם.', 'Still your home.')}<br />{say('הכיף מתחיל עכשיו.', 'The fun starts now.')}</h2>
          <button className="td-btn td-btn-cream" onClick={signup}>{say('בואו נבנה את הבית שלנו', 'Let’s build our home')}<Arrow size={20} />
          </button>
          <span className="td-final-fine">{say('המשימות קטנות. ההבדל מורגש.', 'Small quests. A real difference.')}</span>
          <div className="td-final-orbit" aria-hidden="true" />
        </div>
      </section>
    </main>
    <footer className="td-footer td-container">
      <div>
        <Brand onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <p>{say('עושים מקום לדברים הטובים.', 'Make room for the good stuff.')}</p>
      </div>
      <div className="td-footer-links">
        <button onClick={() => go('how')}>{say('איך זה עובד', 'How it works')}</button>
        <button onClick={() => go('play')}>{say('נסו בעצמכם', 'Try it out')}</button>
        <button onClick={() => go('questions')}>{say('שאלות ותשובות', 'Questions & answers')}</button>
      </div>
      <span className="td-copyright" dir="ltr">© {new Date().getFullYear()} TaskDira.<br />
        <span>Made for real life. With <Heart size={12} />.</span>
      </span>
    </footer>
    <NarratedTour he={he} />
  </div>;
}
