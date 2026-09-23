import { lazy } from "react";
import Landing from "./pages/Landing";
const HomeDashboard = lazy(() => import("./pages/HomeDashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Profile = lazy(() => import("./pages/Profile"));
const Household = lazy(() => import("./pages/Household"));
const AuthRoute = lazy(() => import("./pages/AuthRoute"));
const Insights = lazy(() => import("./pages/Insights"));

/**
 * One table drives routing and navigation.
 *
 * `wired` marks whether a screen reads real data through the services layer.
 * Screens still on hardcoded demo data are reachable so they can be reviewed,
 * but the shell labels them so nobody mistakes the fixtures for live records.
 */
export const ROUTES = [
  {
    key: "landing",
    path: "/landing",
    component: Landing,
    access: "public",
    wired: true,
  },
  {
    key: "login",
    path: "/login",
    component: AuthRoute,
    access: "public",
    wired: true,
  },
  {
    key: "register",
    path: "/register",
    component: AuthRoute,
    access: "public",
    wired: true,
  },
  {
    key: "home",
    path: "/",
    component: HomeDashboard,
    access: "private",
    wired: true,
    nav: true,
    icon: "🏠",
    labelKey: "nav.tasks",
  },
  {
    key: "tasks",
    path: "/tasks",
    component: HomeDashboard,
    access: "private",
    wired: true,
  },
  {
    key: "insights",
    path: "/insights",
    component: Insights,
    access: "private",
    wired: true,
  },
  {
    key: "leaderboard",
    path: "/leaderboard",
    component: Leaderboard,
    access: "private",
    wired: true,
    nav: true,
    icon: "🏆",
    labelKey: "nav.leaderboard",
  },
  {
    key: "rewards",
    path: "/rewards",
    component: Rewards,
    access: "private",
    wired: true,
    nav: true,
    icon: "🎁",
    labelKey: "nav.rewards",
  },
  {
    key: "achievements",
    path: "/achievements",
    component: Achievements,
    access: "private",
    wired: true,
    nav: true,
    icon: "🎖️",
    labelKey: "achievements.title",
  },
  // nav: false — reachable at /profile and from the sidebar's name/avatar block,
  // just not listed in the nav. Route and screen stay fully functional.
  {
    key: "profile",
    path: "/profile",
    component: Profile,
    access: "private",
    wired: true,
    nav: false,
    icon: "🙂",
    labelKey: "profile",
  },
  {
    key: "household",
    path: "/household",
    component: Household,
    access: "private",
    wired: true,
    nav: true,
    icon: "🏡",
    labelKey: "householdLabel",
  },
];

export const NAV_ROUTES = ROUTES.filter((r) => r.nav);

export function findRoute(path) {
  return ROUTES.find((r) => r.path === path) ?? null;
}
