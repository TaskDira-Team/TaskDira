import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Globe2, Heart, Loader2, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useRoute } from '../context/RouteContext';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import { Brand } from './Landing';
import '../components/landing/landing.css';

/** Uses the existing authentication contract and onboarding wizard. */
export default function AuthRoute() {
  const { lang, dir, toggleLang } = useI18n();
  const { path, navigate } = useRoute();
  const { login, register, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const signup = path === '/register';
  const he = lang === 'he';
  const say = (h, e) => he ? h : e;
  const Arrow = he ? ArrowLeft : ArrowRight;
  useEffect(() => { window.scrollTo(0, 0); setError(null); }, [path, setError]);
  const handleLogin = async event => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try { await login(email.trim(), password); } catch { /* AuthContext supplies the visible error. */ }
    finally { setSubmitting(false); }
  };
  return <main className="td-auth" dir={dir}>
    <header className="td-auth-header">
      <Brand onClick={() => navigate('/landing')} />
      <button className="td-lang" onClick={toggleLang} aria-label={say('Switch to English', 'מעבר לעברית')}>
        <Globe2 size={16} />{he ? 'EN' : 'עב'}</button>
    </header>
    <div className="td-auth-layout">
      <section className="td-auth-form-side">
        <button className="td-auth-back" onClick={() => navigate('/landing')}>
          <Arrow size={15} />{say('בחזרה הביתה', 'Back home')}</button>
        <div className="td-auth-form-inner">
          <span className="td-kicker">{say('הבית שלכם, הפרק הבא', 'YOUR HOME, THE NEXT CHAPTER')}</span>
          <h1>{signup ? say('כל בית מתחיל', 'Every home starts') : say('איזה כיף שחזרתם.', 'Good to have you back.')}<br />{signup && <span>{say('באנשים שלו.', 'with its people.')}</span>}</h1>
          <p className="td-auth-intro">{signup ? say('עוד רגע, והדברים הקטנים הופכים למשהו גדול.', 'In a moment, the little things become something bigger.') : say('המשימות, הפרסים והאנשים שלכם כבר מחכים.', 'Your quests, rewards, and people are waiting.')}</p>
          <div className="td-auth-tabs" aria-label={say('כניסה או הרשמה', 'Login or sign up')}>
            <button className={!signup ? 'is-active' : ''} aria-pressed={!signup} onClick={() => navigate('/login')}>{say('כניסה לבית', 'Log in')}</button>
            <button className={signup ? 'is-active' : ''} aria-pressed={signup} onClick={() => navigate('/register')}>{say('הקמת בית חדש', 'Create a home')}</button>
          </div>
          {signup ? <div className="td-onboarding">
            <OnboardingFlow variant="light" showBrand={false} onComplete={register} onBackToLogin={() => navigate('/login')} />
          </div> : <form onSubmit={handleLogin} className="td-login-form">
            <div>
              <label htmlFor="td-email">{say('כתובת אימייל', 'Email address')}</label>
              <input id="td-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" dir="ltr" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="td-password">{say('סיסמה', 'Password')}</label>
              <div className="td-password-field">
                <input id="td-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" dir="ltr" required value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" aria-label={visible ? say('הסתרת הסיסמה', 'Hide password') : say('הצגת הסיסמה', 'Show password')} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {error && <p className="td-auth-error" role="alert">{error}</p>}
            <button className="td-btn td-btn-orange" type="submit" disabled={submitting}>{submitting ? <>
              <Loader2 className="animate-spin" size={19} />{say('נכנסים הביתה…', 'Coming home…')}</> : <>{say('נכנסים הביתה', 'Come on in')}<Arrow size={19} />
            </>}</button>
            <span className="td-auth-secure">
              <LockKeyhole size={12} />{say('הפינה הקטנה שלכם באינטרנט', 'Your own little corner of the internet')}</span>
          </form>}
        </div>
      </section>
      <aside className="td-auth-art">
        <div>
          <span className="td-eyebrow">
            <Heart size={12} />{say('קבוצה אחת. הבית שלכם.', 'One team. Your home.')}</span>
          <h2>{say('אותו בית.', 'Same home.')}<br />
            <span>{say('משחק חדש.', 'New game.')}</span>
          </h2>
          <img src="/images/taskdira-house.webp" width="1254" height="1254" alt={say('בית קטן, מלא בדברים טובים', 'A little home full of good things')} />
          <p>{say('פחות להזכיר. יותר להעריך.', 'Less reminding. More appreciating.')}<br />{say('יותר זמן לדברים שבאמת חשובים.', 'More time for what really matters.')}</p>
          <div className="td-auth-art-fine">
            <Check size={13} />{say('משימות קטנות', 'Small quests')}<span>·</span>
            <Check size={13} />{say('רגעים גדולים', 'Big moments')}</div>
        </div>
      </aside>
    </div>
  </main>;
}
