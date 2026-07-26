import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translateContent } from '../data/contentI18n';

const STORAGE_KEY = 'taskdira_lang';

const TRANSLATIONS = {
  he: {
    brandName: 'TaskDira',
    brandTagline: 'עושים סדר בבית בכיף',
    brandTaglineLong: 'עושים סדר בבית בכיף — משימות, נקודות ופרסים לכל בני הבית.',
    'nav.tasks': 'משימות',
    'nav.leaderboard': 'לוח מנצחים',
    'nav.rewards': 'חנות פרסים',
    'nav.settings': 'הגדרות',
    'nav.calendar': 'יומן',
    'nav.family': 'משפחה',
    'filter.active': 'פעילות',
    'filter.pending': 'ממתינות',
    'filter.done': 'בוצעו',
    'filter.all': 'הכל',
    'filter.everyone': 'כולם',
    'status.todo': 'לביצוע',
    'status.inProgress': 'בתהליך',
    'status.pending': 'ממתין לאישור',
    'status.done': 'בוצע',
    'role.dad': 'אבא',
    'role.mom': 'אמא',
    'role.kid': 'ילד/ה',
    'role.roommate': 'שותף/ה',
    'role.partner': 'בן/בת זוג',
    'role.helper': 'עוזר/ת בדירה',
    'role.admin': 'מנהל',
    'role.member': 'חבר/ה',
    'category.kitchen': 'מטבח',
    'category.living': 'סלון',
    'category.shopping': 'קניות',
    'category.cleaning': 'ניקיון',
    'category.cooking': 'בישול',
    'category.room': 'חדר',
    'category.homework': 'שיעורי בית',
    'category.pet': 'חיות',
    'category.maintenance': 'תחזוקה',
    'category.trash': 'אשפה',
    'category.other': 'אחר',
    rewardsStore: 'חנות פרסים',
    claimReward: 'מימוש פרס',
    addTask: 'משימה חדשה',
    newTask: 'משימה חדשה',
    logout: 'התנתק',
    login: 'התחברות',
    loginCta: 'התחבר',
    register: 'הרשמה',
    admin: 'מנהל',
    profile: 'פרופיל',
    settings: 'הגדרות',
    accessibility: 'נגישות',
    menu: 'תפריט',
    close: 'סגור',
    approve: 'אשר',
    reject: 'דחה',
    claimTask: 'תפוס משימה',
    completeTask: 'סיים משימה + הוכחה',
    subItems: 'רשימת פריטים',
    emptyTasks: 'אין משימות להצגה',
    editTask: 'עריכת משימה',
    titleLabel: 'כותרת',
    titlePlaceholder: 'לדוגמה: שטיפת כלים',
    descriptionLabel: 'תיאור',
    categoryLabel: 'קטגוריה',
    pickCategory: 'בחר קטגוריה',
    pointsLabel: 'נקודות',
    dueDateTime: 'תאריך ושעת יעד',
    groceryList: 'רשימת מצרכים / תת-פריטים',
    addChecklist: '+ הוסף רשימת פריטים',
    assignee: 'אחראי',
    unassigned: 'ללא – משימה פתוחה',
    statusLabel: 'סטטוס',
    cancel: 'ביטול',
    saving: 'שומר...',
    update: 'עדכן',
    createTask: 'צור משימה',
    memberBadge: 'מורשה',
    listLabel: 'רשימה',
    markDone: 'סמן כבוצע',
    itemPlaceholder: 'פריט לקניות…',
    remove: 'הסר',
    addItem: 'הוסף פריט לרשימה',
    proofTitle: 'העלאת הוכחה 📸',
    proofHint: 'לאחר שליחה → ממתין לאישור מנהל · נקודות רק אחרי אישור',
    proofUpload: 'העלאת תמונת הוכחה',
    proofCapture: 'צלמו את המטבח, הסלון או התוצאה',
    proofFormats: 'PNG · JPG · GIF · עד 3MB',
    proofRequired: 'נא להעלות תמונת הוכחה',
    sendForApproval: 'שלח לאישור',
    adminDirectApprove: 'מנהל: אשר ישירות ללא תמונה',
    profileSettings: 'הגדרות פרופיל',
    pointsBalance: 'יתרת נקודות',
    soundEffects: 'אפקטי קול בסיום משימה',
    on: 'פועל',
    off: 'כבוי',
    saveChanges: 'שמור שינויים',
    congrats: 'מזל טוב!',
    redeemedSuccess: 'מימשת בהצלחה:',
    voucherCode: 'קוד שובר',
    remainingBalance: 'נותרו לך',
    nice: 'יופי! 🎉',
    promptRewardName: 'שם הפרס החדש',
    promptRewardThreshold: 'סף פתיחה (נקודות)',
    promptName: 'שם',
    pointsShort: 'נק׳',
    pointsWord: 'נקודות',
    assistantTitle: 'עוזר AI',
    householdLabel: 'הדירה / המשפחה',
    monthlyLeaderboard: 'לוח מנצחים חודשי',
    monthlyGoal: 'יעד חודשי למשפחה',
    balanceThisMonth: 'היתרה שלך החודש',
    milestoneHint: 'פרסים נפתחים בפריצות 50 · 100 · 200',
    addReward: 'הוסף פרס',
    locked: 'נעול',
    missingPoints: 'חסרות',
    premium: 'פרימיום',
    'a11y.title': 'נגישות',
    'a11y.fontSize': 'גודל גופן',
    'a11y.decrease': 'הקטנת גופן',
    'a11y.increase': 'הגדלת גופן',
    'a11y.contrast': 'ניגודיות גבוהה',
    'a11y.readableFont': 'פונט קריא',
    'a11y.highlightLinks': 'הדגשת קישורים וכפתורים',
    'a11y.stopAnimations': 'עצירת הנפשות',
    'a11y.reset': 'איפוס הגדרות',
    quickLogin: 'התחברות מהירה',
    demoPassword: 'סיסמת דמו: 123456',
    emailLabel: 'אימייל',
    passwordLabel: 'סיסמה',
    defaultHousehold: 'המשפחה',
    feature1: 'משימות משותפות בזמן אמת',
    feature2: 'ניקוד דינמי ולוח מנצחים',
    feature3: 'חנות פרסים עם אבני דרך',
    scrollLeft: 'גלול שמאלה',
    scrollRight: 'גלול ימינה',
    langSwitchTo: 'English',
  },
  en: {
    brandName: 'TaskDira',
    brandTagline: 'Household Tasks Made Fun',
    brandTaglineLong: 'Household Tasks Made Fun — tasks, points and rewards for everyone at home.',
    'nav.tasks': 'Tasks',
    'nav.leaderboard': 'Leaderboard',
    'nav.rewards': 'Rewards Store',
    'nav.settings': 'Settings',
    'nav.calendar': 'Calendar',
    'nav.family': 'Family',
    'filter.active': 'To Do',
    'filter.pending': 'Pending Approval',
    'filter.done': 'Completed',
    'filter.all': 'All',
    'filter.everyone': 'Everyone',
    'status.todo': 'To Do',
    'status.inProgress': 'In Progress',
    'status.pending': 'Pending Approval',
    'status.done': 'Completed',
    'role.dad': 'Dad',
    'role.mom': 'Mom',
    'role.kid': 'Kid',
    'role.roommate': 'Housemate',
    'role.partner': 'Partner',
    'role.helper': 'Home Helper',
    'role.admin': 'Admin',
    'role.member': 'Member',
    'category.kitchen': 'Kitchen',
    'category.living': 'Living Room',
    'category.shopping': 'Groceries',
    'category.cleaning': 'Cleaning',
    'category.cooking': 'Cooking',
    'category.room': 'Room',
    'category.homework': 'Homework',
    'category.pet': 'Pets',
    'category.maintenance': 'Maintenance',
    'category.trash': 'Trash',
    'category.other': 'Other',
    rewardsStore: 'Rewards Store',
    claimReward: 'Claim Reward',
    addTask: 'Add Task',
    newTask: 'Add Task',
    logout: 'Logout',
    login: 'Login',
    loginCta: 'Sign in',
    register: 'Register',
    admin: 'Admin',
    profile: 'Profile',
    settings: 'Settings',
    accessibility: 'Accessibility',
    menu: 'Menu',
    close: 'Close',
    approve: 'Approve',
    reject: 'Reject',
    claimTask: 'Claim task',
    completeTask: 'Complete with proof',
    subItems: 'Item list',
    emptyTasks: 'No tasks to show',
    editTask: 'Edit task',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Wash the dishes',
    descriptionLabel: 'Description',
    categoryLabel: 'Category',
    pickCategory: 'Pick a category',
    pointsLabel: 'Points',
    dueDateTime: 'Due date and time',
    groceryList: 'Grocery list / sub-items',
    addChecklist: '+ Add checklist',
    assignee: 'Assignee',
    unassigned: 'Unassigned – open task',
    statusLabel: 'Status',
    cancel: 'Cancel',
    saving: 'Saving...',
    update: 'Update',
    createTask: 'Create task',
    memberBadge: 'Member',
    listLabel: 'List',
    markDone: 'Mark as done',
    itemPlaceholder: 'Grocery item…',
    remove: 'Remove',
    addItem: 'Add item to list',
    proofTitle: 'Upload proof 📸',
    proofHint: 'After sending → pending admin approval · points only after approval',
    proofUpload: 'Upload a proof photo',
    proofCapture: 'Snap the kitchen, living room or the result',
    proofFormats: 'PNG · JPG · GIF · up to 3MB',
    proofRequired: 'Please upload a proof photo',
    sendForApproval: 'Send for approval',
    adminDirectApprove: 'Admin: approve without a photo',
    profileSettings: 'Profile settings',
    pointsBalance: 'Points balance',
    soundEffects: 'Sound effects on task completion',
    on: 'On',
    off: 'Off',
    saveChanges: 'Save changes',
    congrats: 'Congratulations!',
    redeemedSuccess: 'You successfully redeemed:',
    voucherCode: 'Voucher code',
    remainingBalance: 'You have left',
    nice: 'Nice! 🎉',
    promptRewardName: 'New reward name',
    promptRewardThreshold: 'Unlock threshold (points)',
    promptName: 'Name',
    pointsShort: 'Pts',
    pointsWord: 'Points',
    assistantTitle: 'AI Assistant',
    householdLabel: 'Home / Family',
    monthlyLeaderboard: 'Monthly Leaderboard',
    monthlyGoal: 'Monthly Goal',
    balanceThisMonth: 'Your balance this month',
    milestoneHint: 'Rewards unlock at 50 · 100 · 200',
    addReward: 'Add reward',
    locked: 'Locked',
    missingPoints: 'Missing',
    premium: 'Premium',
    'a11y.title': 'Accessibility',
    'a11y.fontSize': 'Font size',
    'a11y.decrease': 'Decrease font size',
    'a11y.increase': 'Increase font size',
    'a11y.contrast': 'High contrast',
    'a11y.readableFont': 'Readable font',
    'a11y.highlightLinks': 'Highlight links and buttons',
    'a11y.stopAnimations': 'Stop animations',
    'a11y.reset': 'Reset settings',
    quickLogin: 'Quick login',
    demoPassword: 'Demo password: 123456',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    defaultHousehold: 'Family',
    feature1: 'Shared tasks in real time',
    feature2: 'Dynamic scoring and leaderboard',
    feature3: 'Rewards store with milestones',
    scrollLeft: 'Scroll left',
    scrollRight: 'Scroll right',
    langSwitchTo: 'עברית',
  },
};

const HOUSEHOLD_NAMES = {
  'משפחת ספרינט': { he: 'משפחת ספרינט', en: 'Sprint Family' },
};

function readLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' || saved === 'he' ? saved : 'he';
  } catch {
    return 'he';
  }
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readLang);
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'he' ? 'en' : 'he');
  }, [lang, setLang]);

  const value = useMemo(() => {
    const dict = TRANSLATIONS[lang];
    const t = (key) => dict[key] ?? TRANSLATIONS.he[key] ?? key;
    const p = (n) => `${n ?? 0} ${dict.pointsShort}`;
    const householdName = (name) => {
      if (!name) return dict.defaultHousehold;
      const mapped = HOUSEHOLD_NAMES[name];
      return mapped ? mapped[lang] : name;
    };
    const category = (id, fallback) => dict[`category.${id}`] ?? fallback ?? id;
    const role = (id, fallback) => dict[`role.${id}`] ?? fallback ?? id;
    const tx = (text) => translateContent(text, lang);
    return { lang, dir, t, p, householdName, category, role, tx, toggleLang, setLang };
  }, [lang, dir, toggleLang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
