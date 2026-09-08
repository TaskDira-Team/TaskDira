export const TOUR_SECTIONS = [
  { id: 'main', he: 'ברוכים הבאים הביתה', en: 'Welcome home', textHe: 'ברוכים הבאים לטאסק דירה. כאן הופכים מטלות קטנות לניצחונות משפחתיים. לחצו על הבית כדי להיכנס לסיור בתלת ממד, ולגלות מה מחכה בכל חדר.', textEn: 'Welcome to TaskDira. A little home for your family’s everyday wins. Step into the three dimensional house, open the roof, and explore each room.' },
  { id: 'how', he: 'שלושה צעדים קטנים', en: 'Three little steps', textHe: 'מתחילים בבית משלכם. מזמינים את המשפחה, יוצרים משימות ובוחרים פרסים. כולם יודעים מה לעשות, וכל מאמץ קטן מקבל מקום.', textEn: 'Start with your own household. Invite your people, create a few quests, and choose rewards together. Everyone knows what to do, and every little effort counts.' },
  { id: 'play', he: 'עכשיו תורכם לשחק', en: 'Your turn to play', textHe: 'כאן אפשר לנסות בעצמכם. שמרו משימות בצד, השלימו אותן בזמנכם וצברו נקודות. בחנות הפרסים כבר מחכה לכם ערב פיצה. זו הדגמה, והיא לא משנה את החשבון שלכם.', textEn: 'This is your playground. Save chores for later, complete them when you are ready, and earn points. Your next pizza night is waiting in the reward shop. This demo never changes your account.' },
  { id: 'features', he: 'הדברים שעושים הבדל', en: 'The little extras', textHe: 'פרסים שבוחרים ביחד, רצפים שמעודדים התמדה, ולוח משפחתי שמפרגן לכולם. המטרה היא פשוטה: פחות להזכיר, ויותר לעשות ביחד.', textEn: 'Rewards you choose together. Streaks that celebrate showing up. A family board that recognizes everyone. Less reminding, and more doing things together.' },
  { id: 'questions', he: 'טוב ששאלתם', en: 'Glad you asked', textHe: 'לא צריך להוריד אפליקציה. אפשר להתחיל מהדפדפן, גם בטלפון. משפחות, זוגות ושותפים יכולים ליצור בית שמתאים להם. כשתהיו מוכנים, מתחילים ביחד.', textEn: 'No download needed. Start in your browser, on your phone or computer. Families, couples, and roommates can all build a household that fits. When you are ready, let’s get started.' },
];
export function chooseVoice(voices, language) {
  const prefix = language === 'he' ? 'he' : 'en';
  const matches = voices.filter(voice => voice.lang?.toLowerCase().split('-')[0] === prefix);
  return matches.find(voice => voice.localService) || matches[0] || null;
}
export function activeTourSection(positions, line) {
  return positions.reduce((current, section, index) => section.top <= line ? index : current, 0);
}
