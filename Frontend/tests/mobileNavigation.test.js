import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileAccountNav from '../src/components/layout/MobileAccountNav.js';

test('mobile account controls expose native named buttons, current page, and correct actions in both languages', () => {
  for (const [profileLabel, logoutLabel] of [['Profile', 'Logout'], ['פרופיל', 'התנתק']]) {
    const navigations = [];
    let logouts = 0;
    const tree = MobileAccountNav({ path: '/profile', profileLabel, logoutLabel,
      onNavigate: path => navigations.push(path), onLogout: () => logouts++ });
    const markup = renderToStaticMarkup(tree);
    assert.match(markup, /<button type="button"[^>]*aria-current="page"/);
    assert.ok(markup.includes(profileLabel));
    assert.ok(markup.includes(logoutLabel));
    assert.equal((markup.match(/<button /g) || []).length, 2);
    const [profile, logout] = tree.props.children;
    profile.props.onClick();
    logout.props.onClick();
    assert.deepEqual(navigations, ['/profile']);
    assert.equal(logouts, 1);
  }
  const inactive = MobileAccountNav({ path: '/', profileLabel: 'Profile', logoutLabel: 'Logout' });
  assert.equal(inactive.props.children[0].props['aria-current'], undefined);
});
