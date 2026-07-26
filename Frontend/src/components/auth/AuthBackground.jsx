export default function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgb(99_102_241_/_0.45),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,rgb(168_85_247_/_0.35),transparent_45%)]" />

      <div className="auth-orb auth-orb-1 absolute -top-20 -left-10 h-80 w-80 rounded-full bg-indigo-500/50 blur-3xl animate-pulse" />
      <div className="auth-orb auth-orb-2 absolute top-[28%] -right-16 h-96 w-96 rounded-full bg-violet-500/40 blur-3xl" />
      <div className="auth-orb auth-orb-3 absolute -bottom-24 left-[20%] h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/30 blur-3xl animate-pulse" />
      <div className="auth-orb auth-orb-1 absolute top-[60%] left-[55%] h-56 w-56 rounded-full bg-sky-400/25 blur-3xl" />

      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="auth-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgb(2_6_23_/_0.55)_100%)]" />
    </div>
  );
}
