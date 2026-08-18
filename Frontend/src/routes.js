import Landing from './pages/Landing';
import HomeDashboard from './pages/HomeDashboard';
import Leaderboard from './pages/Leaderboard';
import Rewards from './pages/Rewards';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';
import Household from './pages/Household';
import AuthRoute from './pages/AuthRoute';

/**
 * One table drives routing and navigation.
 *
 * `wired` marks whether a screen reads real data through the services layer.
 * Screens still on hardcoded demo data are reachable so they can be reviewed,
 * but the shell labels them so nobody mistakes the fixtures for live records.
 */
export const ROUTES = [
  { key: 'landing', path: '/landing', component: Landing, access: 'public', wired: true },
  { key: 'login', path: '/login', component: AuthRoute, access: 'public', wired: true },
  { key: 'home', path: '/', component: HomeDashboard, access: 'private', wired: true, nav: true, icon: '🏠', labelKey: 'nav.tasks' },
  { key: 'leaderboard', path: '/leaderboard', component: Leaderboard, access: 'private', wired: true, nav: true, icon: '🏆', labelKey: 'nav.leaderboard' },
  { key: 'rewards', path: '/rewards', component: Rewards, access: 'private', wired: true, nav: true, icon: '🎁', labelKey: 'nav.rewards' },
  { key: 'achievements', path: '/achievements', component: Achievements, access: 'private', wired: false, nav: true, icon: '🎖️', labelKey: 'achievements.title' },
  { key: 'profile', path: '/profile', component: Profile, access: 'private', wired: true, nav: true, icon: '🙂', labelKey: 'profile' },
  { key: 'household', path: '/household', component: Household, access: 'private', wired: true, nav: true, icon: '🏡', labelKey: 'householdLabel' },
];

export const NAV_ROUTES = ROUTES.filter((r) => r.nav);

export function findRoute(path) {
  return ROUTES.find((r) => r.path === path) ?? null;
}
