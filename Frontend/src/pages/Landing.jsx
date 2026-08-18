import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useRoute } from '../context/RouteContext';
import {
  ACCENTS,
  Aurora,
  Avatar,
  CountUp,
  Eyebrow,
  GhostButton,
  LimeButton,
  Num,
  Panel,
  XPBar,
} from '../components/ui/kit';

const STATS = [
  { to: 12480, suffix: '+', labelKey: 'landing.stat.families', accent: 'grape' },
  { to: 3200000, suffix: '', labelKey: 'landing.stat.tasks', accent: 'lime' },
  { to: 87400000, suffix: '', labelKey: 'landing.stat.points', accent: 'sky' },
  { to: 96, suffix: '%', labelKey: 'landing.stat.satisfaction', accent: 'gold' },
];

const FEATURES = [
  { emoji: '⚔️', key: 'landing.feature1', accent: 'lime' },
  { emoji: '📈', key: 'landing.feature2', accent: 'grape' },
  { emoji: '🔥', key: 'landing.feature3', accent: 'coral' },
  { emoji: '🏆', key: 'landing.feature4', accent: 'gold' },
  { emoji: '🎁', key: 'landing.feature5', accent: 'sky' },
  { emoji: '🎖️', key: 'landing.feature6', accent: 'mint' },
];

const TESTIMONIALS = [
  { key: 'landing.t1', emoji: '🦊', ring: 'grape', stars: 5 },
  { key: 'landing.t2', emoji: '🐼', ring: 'sky', stars: 5 },
  { key: 'landing.t3', emoji: '🐯', ring: 'coral', stars: 4 },
];

/* ---- hand-built area chart: one lime series over one grape series ---- */
const SERIES_A = [18, 26, 22, 38, 44, 41, 58, 66, 61, 78, 88, 96];
const SERIES_B = [12, 15, 19, 21, 28, 26, 33, 38, 36, 44, 49, 57];
const MONTHS = {
  he: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function AreaChart() {
  const { t, lang, dir } = useI18n();
  const [hover, setHover] = useState(null);
  const W = 640;
  const H = 240;
  const x = (i) => (i / (SERIES_A.length - 1)) * W;
  const y = (v) => H - (v / 100) * H;

  const path = (s) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const area = (s) => `${path(s)} L${W},${H} L0,${H} Z`;

  const months = MONTHS[lang] ?? MONTHS.he;

  return (
    <div
      className="relative"
      onMouseLeave={() => setHover(null)}
      // chart reads left-to-right as a time axis even inside the RTL page
      dir="ltr"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t('landing.chartAria')}>
        <defs>
          <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENTS.lime} stopOpacity="0.55" />
            <stop offset="100%" stopColor={ACCENTS.lime} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENTS.grape} stopOpacity="0.45" />
            <stop offset="100%" stopColor={ACCENTS.grape} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1="0"
            x2={W}
            y1={g * H}
            y2={g * H}
            stroke="#ffffff"
            strokeOpacity="0.07"
            strokeDasharray="3 6"
          />
        ))}

        <path d={area(SERIES_B)} fill="url(#gB)" />
        <path d={path(SERIES_B)} fill="none" stroke={ACCENTS.grape} strokeWidth="2.5" />
        <path d={area(SERIES_A)} fill="url(#gA)" />
        <path
          d={path(SERIES_A)}
          fill="none"
          stroke={ACCENTS.lime}
          strokeWidth="3"
          style={{ filter: `drop-shadow(0 0 8px ${ACCENTS.lime})` }}
        />

        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1="0"
              y2={H}
              stroke={ACCENTS.lime}
              strokeOpacity="0.5"
            />
            <circle cx={x(hover)} cy={y(SERIES_A[hover])} r="6" fill={ACCENTS.lime} />
            <circle cx={x(hover)} cy={y(SERIES_B[hover])} r="5" fill={ACCENTS.grape} />
          </g>
        )}

        {SERIES_A.map((_, i) => (
          <rect
            key={i}
            x={x(i) - W / 24}
            y="0"
            width={W / 12}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      <div className="num mt-2 flex justify-between px-1 text-[10px] text-ink-faint">
        {months.map((m, i) => (
          <span key={m} className={hover === i ? 'text-lime' : ''}>
            {m}
          </span>
        ))}
      </div>

      {hover !== null && (
        <div className="num mt-3 flex gap-4 text-[12px]" dir={dir}>
          <span className="text-lime">
            {t('landing.chartTasks')}: {SERIES_A[hover]}K
          </span>
          <span className="text-grape">
            {t('landing.chartRewards')}: {SERIES_B[hover]}K
          </span>
        </div>
      )}
    </div>
  );
}

function PhoneMock() {
  const { t } = useI18n();
  const tasks = [
    { e: '🧺', label: t('landing.phone.task1'), xp: 40, a: 'sky' },
    { e: '🐕', label: t('landing.phone.task2'), xp: 25, a: 'coral' },
    { e: '🍽️', label: t('landing.phone.task3'), xp: 30, a: 'gold' },
  ];
  return (
    <div className="anim-bob relative mx-auto w-[290px]">
      <div
        className="relative overflow-hidden rounded-[42px] border-[6px] border-panel bg-abyss p-4"
        style={{ boxShadow: '0 60px 100px -40px #a06cffaa, inset 0 1px 0 #ffffff22' }}
      >
        <div className="num mb-4 flex items-center justify-between text-[10px] text-ink-faint">
          <span>21:04</span>
          <span>▮▮▮</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-panel/70 p-4">
          <div className="flex items-center gap-3">
            <Avatar emoji="🦊" ring="lime" size={46} level={12} />
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold">{t('landing.phone.name')}</div>
              <div className="num text-[11px] text-ink-faint">1,840 / 2,400 XP</div>
            </div>
          </div>
          <div className="mt-3">
            <XPBar value={76} />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.label}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-panel/50 p-2.5"
            >
              <span className="text-lg">{task.e}</span>
              <span className="flex-1 text-[13px] font-bold">{task.label}</span>
              <span className="num text-[11px] font-extrabold" style={{ color: ACCENTS[task.a] }}>
                +{task.xp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* bobbing badges */}
      <div
        className="anim-bob-soft absolute -top-5 -left-8 rounded-2xl border border-lime/50 bg-abyss/90 px-3 py-2 backdrop-blur"
        style={{ boxShadow: '0 0 30px -8px #b8f06a', animationDelay: '-1.2s' }}
      >
        <div className="num text-lg font-extrabold text-lime">+120</div>
        <div className="text-[10px] font-bold text-ink-dim">XP</div>
      </div>
      <div
        className="anim-bob-soft absolute top-1/3 -right-10 rounded-2xl border border-gold/50 bg-abyss/90 px-3 py-2 backdrop-blur"
        style={{ boxShadow: '0 0 30px -8px #ffcb47', animationDelay: '-2.4s' }}
      >
        <div className="num text-lg font-extrabold text-gold">LV 12</div>
        <div className="text-[10px] font-bold text-ink-dim">{t('landing.phone.level')}</div>
      </div>
      <div
        className="anim-bob-soft absolute -bottom-4 -left-4 rounded-2xl border border-coral/50 bg-abyss/90 px-3 py-2 backdrop-blur"
        style={{ boxShadow: '0 0 30px -8px #ff7a8a', animationDelay: '-3.1s' }}
      >
        <div className="num text-lg font-extrabold text-coral">🔥 18</div>
        <div className="text-[10px] font-bold text-ink-dim">{t('landing.phone.streak')}</div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { t, lang, dir } = useI18n();
  const { navigate } = useRoute();
  const goToAuth = () => navigate('/login');
  const quote = (text) => (lang === 'he' ? `״${text}״` : `“${text}”`);

  return (
    <div dir={dir} className="font-landing relative min-h-screen overflow-hidden bg-void text-ink">
      <Aurora />
      <div className="relative px-6 pb-16 pt-6 sm:px-10 lg:px-16">
        {/* nav */}
        <nav className="mb-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-lime to-lime-deep text-xl"
              style={{ boxShadow: '0 0 24px -6px #b8f06a' }}
            >
              🏡
            </span>
            <span className="text-xl font-black tracking-tight">{t('brandName')}</span>
          </div>
          <ul className="hidden items-center gap-7 text-sm font-bold text-ink-dim lg:flex">
            {['landing.nav.how', 'landing.nav.features', 'landing.nav.pricing', 'landing.nav.families'].map(
              (key) => (
                <li key={key}>
                  <a href="#" className="transition hover:text-lime">
                    {t(key)}
                  </a>
                </li>
              )
            )}
          </ul>
          <div className="flex items-center gap-3">
            <GhostButton onClick={goToAuth}>{t('login')}</GhostButton>
            <LimeButton size="sm" onClick={goToAuth}>
              {t('register')}
            </LimeButton>
          </div>
        </nav>

        {/* hero */}
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Eyebrow>{t('landing.eyebrow')}</Eyebrow>
            <h1 className="mt-5 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl lg:text-7xl">
              {t('landing.hero1')}
              <br />
              <span
                className="bg-gradient-to-l from-lime via-mint to-sky bg-clip-text text-transparent"
                style={{ filter: 'drop-shadow(0 0 26px #b8f06a55)' }}
              >
                {t('landing.hero2')}
              </span>
              <br />
              {t('landing.hero3')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-dim">{t('landing.heroText')}</p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <LimeButton size="lg" onClick={goToAuth}>
                {t('landing.ctaStart')}
              </LimeButton>
              <GhostButton className="px-6 py-4 text-base" onClick={goToAuth}>
                ▶︎ {t('landing.ctaDemo')}
              </GhostButton>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex flex-row-reverse">
                {[
                  ['🦊', 'lime'],
                  ['🐼', 'sky'],
                  ['🐯', 'coral'],
                  ['🐨', 'grape'],
                  ['🦉', 'gold'],
                ].map(([e, a], i) => (
                  <div key={e} style={{ marginRight: i ? -12 : 0 }}>
                    <Avatar emoji={e} ring={a} size={40} />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="num font-extrabold text-lime">12,480+</div>
                <div className="text-ink-faint">{t('landing.socialProof')}</div>
              </div>
            </div>
          </div>

          <PhoneMock />
        </div>

        {/* stats band */}
        <Panel className="mt-24 overflow-hidden p-1" glow accent="grape">
          <div className="grid gap-px overflow-hidden rounded-[22px] bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.labelKey} className="bg-abyss/85 px-6 py-9 text-center">
                <div
                  className="text-4xl font-black lg:text-5xl"
                  style={{ color: ACCENTS[s.accent], textShadow: `0 0 30px ${ACCENTS[s.accent]}66` }}
                >
                  <CountUp to={s.to} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-sm font-bold text-ink-dim">{t(s.labelKey)}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* features */}
        <div className="mt-24">
          <Eyebrow accent="grape">{t('landing.featuresEyebrow')}</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-4xl leading-tight font-black">
            {t('landing.featuresTitle1')}
            <span className="text-lime">{t('landing.featuresTitle2')}</span>
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Panel
                key={f.key}
                className="group p-6 transition-transform duration-300 hover:-translate-y-1.5"
              >
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl text-2xl transition group-hover:scale-110"
                  style={{
                    background: `${ACCENTS[f.accent]}1f`,
                    border: `1px solid ${ACCENTS[f.accent]}55`,
                    boxShadow: `0 0 26px -10px ${ACCENTS[f.accent]}`,
                  }}
                >
                  {f.emoji}
                </div>
                <h3 className="mt-5 text-lg font-extrabold">{t(`${f.key}.title`)}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-dim">{t(`${f.key}.line`)}</p>
              </Panel>
            ))}
          </div>
        </div>

        {/* chart */}
        <Panel className="mt-24 grid gap-10 p-8 lg:grid-cols-[1.4fr_1fr] lg:p-12" glow accent="lime">
          <div>
            <Eyebrow accent="sky">{t('landing.resultsEyebrow')}</Eyebrow>
            <h2 className="mt-4 text-3xl leading-tight font-black">{t('landing.chartTitle')}</h2>
            <p className="mt-2 max-w-md text-[15px] text-ink-dim">{t('landing.chartText')}</p>
            <div className="mt-8">
              <AreaChart />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:border-r lg:border-white/10 lg:pr-10">
            {[
              { n: '340%', key: 'landing.kpi1', a: 'lime' },
              { n: '71%', key: 'landing.kpi2', a: 'grape' },
              { n: '96%', key: 'landing.kpi3', a: 'sky' },
            ].map((k) => (
              <div
                key={k.n}
                className="rounded-2xl border p-6"
                style={{ borderColor: `${ACCENTS[k.a]}33`, background: `${ACCENTS[k.a]}0f` }}
              >
                <div
                  className="text-4xl font-black"
                  style={{ color: ACCENTS[k.a], textShadow: `0 0 24px ${ACCENTS[k.a]}55` }}
                >
                  <Num>{k.n}</Num>
                </div>
                <div className="mt-1 font-extrabold">{t(`${k.key}.label`)}</div>
                <div className="mt-0.5 text-[13px] text-ink-faint">{t(`${k.key}.sub`)}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* testimonials */}
        <div className="mt-24">
          <Eyebrow accent="gold">{t('landing.testimonialsEyebrow')}</Eyebrow>
          <h2 className="mt-4 text-4xl font-black">{t('landing.testimonialsTitle')}</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((tm) => (
              <Panel key={tm.key} className="flex flex-col p-7">
                <div className="num flex gap-0.5 text-lg text-gold">
                  {'★'.repeat(tm.stars)}
                  <span className="text-white/15">{'★'.repeat(5 - tm.stars)}</span>
                </div>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">
                  {quote(t(`${tm.key}.quote`))}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <Avatar emoji={tm.emoji} ring={tm.ring} size={44} />
                  <div>
                    <div className="font-extrabold">{t(`${tm.key}.name`)}</div>
                    <div className="num text-[12px] text-ink-faint">{t(`${tm.key}.role`)}</div>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>

        {/* footer CTA */}
        <div
          className="relative mt-24 overflow-hidden rounded-[36px] border border-lime/25 px-8 py-16 text-center lg:px-16"
          style={{
            background:
              'radial-gradient(120% 140% at 50% 0%, #8fd53a2e 0%, transparent 55%), linear-gradient(180deg,#221459,#0a0620)',
          }}
        >
          <h2 className="mx-auto max-w-3xl text-4xl leading-tight font-black lg:text-5xl">
            {t('landing.cta1')}
            <span className="bg-gradient-to-l from-lime to-mint bg-clip-text text-transparent">
              {t('landing.cta2')}
            </span>
            {t('landing.cta3')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-dim">{t('landing.ctaText')}</p>
          <div className="mt-9 flex justify-center">
            <LimeButton size="lg" onClick={goToAuth}>
              {t('landing.ctaButton')}
            </LimeButton>
          </div>
          <div className="num mt-5 text-[12px] text-ink-faint">{t('landing.ctaFine')}</div>
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-[13px] text-ink-faint">
          <span className="num">{t('landing.footerCopy')}</span>
          <div className="flex gap-6">
            {['landing.footer.privacy', 'landing.footer.terms', 'accessibility', 'landing.footer.contact'].map(
              (key) => (
                <a key={key} href="#" className="transition hover:text-lime">
                  {t(key)}
                </a>
              )
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
