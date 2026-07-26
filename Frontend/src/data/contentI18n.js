export const CONTENT_EN = {
  'שטיפת כלים': 'Wash the Dishes',
  'לשטוף כלים אחרי ארוחת ערב': 'Wash the dishes after dinner',
  'קניות בסופר': 'Grocery Shopping',
  'רשימת קניות לשבוע': 'Weekly grocery list',
  'חלב 3%': 'Milk 3%',
  'לחם מחמצת': 'Sourdough bread',
  'ביצים - 12 יח׳': 'Eggs - 12 pcs',
  'עגבניות - 1 ק״ג': 'Tomatoes - 1 kg',
  'ניקוי מטבח': 'Clean Kitchen',
  'לנקות משטחים ושואב אבק': 'Wipe surfaces and vacuum',
  'סדר את החדר': 'Tidy the Room',
  'לסדר את המיטה, לארגן צעצועים ולשאוב': 'Make the bed, organize toys and vacuum',
  'שיעורי בית': 'Homework',
  'מתמטיקה ואנגלית – עמודים 12-15': 'Math and English – pages 12-15',
  'להוריד את הכלב': 'Walk the Dog',
  'טיול ערב בפארק': 'Evening walk in the park',
  'ניקוי סלון': 'Clean Living Room',
  'שואב אבק + סידור כריות': 'Vacuum + fluff the cushions',
  'ניקוי מקרר': 'Clean the Fridge',
  'לנקות מדפים ולזרוק מוצרים שפג תוקפם': 'Clean shelves and toss expired items',
  'פטור כלים לשבוע 🍽️': 'Dish duty free for a week 🍽️',
  'שבוע בלי שטיפת כלים — פריצת 50 נק׳': 'A week without dishes — unlock at 50 Pts',
  'העברת Bit 50 ₪ 💸': 'Bit transfer 50 ₪ 💸',
  'העברת Bit ישירה — פריצת 100 נק׳': 'Direct Bit transfer — unlock at 100 Pts',
  'שובר BuyMe 100 ₪ 🎁': 'BuyMe voucher 100 ₪ 🎁',
  'שובר BuyMe לרשתות מזון ובילוי — Tier 3 פרימיום': 'BuyMe voucher for food & leisure — Tier 3 premium',
  'פטור מתורנות סופ״ש 🛋️': 'Weekend chore pass 🛋️',
  'סופ״ש חופשי ממטלות — Tier 3 פרימיום': 'Chore-free weekend — Tier 3 premium',
  'משימה ממתינה לאישור': 'Task pending approval',
  'ניקוי מקרר – Ofek שלח הוכחה': 'Clean the Fridge – Ofek submitted proof',
  '⏰ באיחור': '⏰ Overdue',
  באיחור: 'Overdue',
  '📅 היום': '📅 Today',
  היום: 'Today',
  '⏳ מחר': '⏳ Tomorrow',
  מחר: 'Tomorrow',
  '⏳ בעוד 2 ימים': '⏳ In 2 days',
  רשימה: 'List',
  'רשימת פריטים': 'Item List',
};

export function translateContent(text, lang) {
  if (!text || lang !== 'en') return text;
  if (CONTENT_EN[text]) return CONTENT_EN[text];

  const daysMatch = text.match(/^⏳ בעוד (\d+) ימים$/);
  if (daysMatch) return `⏳ In ${daysMatch[1]} days`;

  const todayAt = text.match(/^היום ב-(.+)$/);
  if (todayAt) return `Today at ${todayAt[1]}`;

  const tomorrowAt = text.match(/^מחר ב-(.+)$/);
  if (tomorrowAt) return `Tomorrow at ${tomorrowAt[1]}`;

  const atMatch = text.match(/^(.+) ב-(.+)$/);
  if (atMatch && CONTENT_EN[atMatch[1]]) {
    return `${CONTENT_EN[atMatch[1]]} at ${atMatch[2]}`;
  }

  return text;
}
