import { createElement as h } from 'react';

export default function MobileAccountNav({ path, onNavigate, onLogout, profileLabel, logoutLabel }) {
  const style = 'min-h-11 rounded-xl border border-white/15 px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime';
  return h('div', { className: 'flex gap-2' },
    h('button', { type: 'button', className: style, 'aria-current': path === '/profile' ? 'page' : undefined, onClick: () => onNavigate('/profile') }, profileLabel),
    h('button', { type: 'button', className: `${style} text-coral`, onClick: onLogout }, logoutLabel));
}
