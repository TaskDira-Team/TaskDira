export const DEMO_STORAGE_KEY = 'taskdira_playground_v1';
export const QUESTS = [
  { id: 'dishes', he: 'לפנות את המדיח', en: 'Empty the dishwasher', categoryHe: 'מטבח', categoryEn: 'Kitchen', emoji: '🍽️', points: 30, minutes: 5 },
  { id: 'plants', he: 'להשקות את העציצים', en: 'Water the plants', categoryHe: 'סלון', categoryEn: 'Living room', emoji: '🪴', points: 25, minutes: 3 },
  { id: 'laundry', he: 'לקפל את הכביסה', en: 'Fold the laundry', categoryHe: 'חדר כביסה', categoryEn: 'Laundry', emoji: '🧺', points: 40, minutes: 10 },
  { id: 'dog', he: 'לטייל עם לוקה', en: 'Walk Luka', categoryHe: 'החבר הכי טוב', categoryEn: 'Our best friend', emoji: '🐕', points: 35, minutes: 15 },
];
export const REWARDS = [
  { id: 'pizza', he: 'ערב פיצה משפחתי', en: 'Family pizza night', subHe: 'עם התוספות שאתם אוהבים', subEn: 'With all your favorite toppings', emoji: '🍕', cost: 250, color: 'peach' },
  { id: 'movie', he: 'לבחור את הסרט', en: 'Pick the movie', subHe: 'הספה, הפופקורן והבחירה שלכם', subEn: 'Your couch. Your popcorn. Your choice.', emoji: '🎬', cost: 100, color: 'purple' },
  { id: 'icecream', he: 'יוצאים לגלידה', en: 'An ice cream date', subHe: 'עוד סיבה לצאת ביחד', subEn: 'One more reason to go out together', emoji: '🍦', cost: 150, color: 'green' },
];
export const initialDemo = () => ({ completed: [], redeemed: [] });
export const earnedPoints = state => QUESTS.filter(q => state.completed.includes(q.id)).reduce((sum, q) => sum + q.points, 0);
export const balance = state => 180 + earnedPoints(state) - REWARDS.filter(r => state.redeemed.includes(r.id)).reduce((sum, r) => sum + r.cost, 0);
export function validDemo(value) {
  if (!value || !Array.isArray(value.completed) || !Array.isArray(value.redeemed)) return initialDemo();
  const state = { completed: [...new Set(value.completed.filter(id => QUESTS.some(q => q.id === id)))], redeemed: [...new Set(value.redeemed.filter(id => REWARDS.some(r => r.id === id)))] };
  return balance(state) >= 0 ? state : initialDemo();
}
export function completeQuest(state, id) {
  if (!QUESTS.some(q => q.id === id) || state.completed.includes(id)) return state;
  return { ...state, completed: [...state.completed, id] };
}
export function redeemReward(state, id) {
  const reward = REWARDS.find(r => r.id === id);
  if (!reward || state.redeemed.includes(id) || balance(state) < reward.cost) return state;
  return { ...state, redeemed: [...state.redeemed, id] };
}
