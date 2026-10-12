// Fictional, bilingual household content. Loaded as records only in demo mode.
const pair = (en, he) => ({ en, he });
export const DEMO_MISSIONS = [
  [
    "room",
    10,
    pair("Rescue the floor toys", "מצילים את הצעצועים מהרצפה"),
    [
      pair("Find five toys on the floor", "מוצאים חמישה צעצועים על הרצפה"),
      pair("Put them in their basket", "מניחים אותם בסל שלהם"),
      pair("Check that the walking path is clear", "בודקים שהדרך פנויה להליכה"),
    ],
  ],
  [
    "kitchen",
    15,
    pair("Set the dinner table", "עורכים את השולחן לארוחת ערב"),
    [
      pair("Ask how many places we need", "שואלים כמה מקומות צריך"),
      pair("Set out napkins and safe cups", "מניחים מפיות וכוסות בטוחות"),
      pair(
        "Ask a grown-up to bring the plates",
        "מבקשים ממבוגר להביא את הצלחות",
      ),
    ],
  ],
  [
    "cleaning",
    10,
    pair("Find the missing sock twins", "מחפשים את התאומים של הגרביים"),
    [
      pair("Spread the clean socks out", "פורשים את הגרביים הנקיים"),
      pair("Match the colours and patterns", "מתאימים צבעים ודוגמאות"),
      pair("Put each pair in the drawer", "מניחים כל זוג במגירה"),
    ],
  ],
  [
    "room",
    10,
    pair("Give your bed a fresh start", "מסדרים את המיטה"),
    [
      pair("Pull the blanket flat", "מיישרים את השמיכה"),
      pair("Put your pillow at the top", "מניחים את הכרית בראש המיטה"),
      pair("Choose a toy to guard the bed", "בוחרים צעצוע שישמור על המיטה"),
    ],
  ],
  [
    "other",
    15,
    pair("Water the thirsty plants", "משקים את הצמחים הצמאים"),
    [
      pair("Ask which plant needs water", "שואלים איזה צמח צריך מים"),
      pair(
        "Fill the small watering can with help",
        "ממלאים את המשפך הקטן בעזרה",
      ),
      pair("Pour slowly onto the soil", "שופכים לאט על האדמה"),
    ],
  ],
  [
    "living",
    10,
    pair("Build a cosy reading corner", "מסדרים פינת קריאה נעימה"),
    [
      pair("Return the books to their shelf", "מחזירים את הספרים למדף"),
      pair("Put the cushions on the sofa", "מניחים את הכריות על הספה"),
      pair("Choose tonight’s story", "בוחרים סיפור להערב"),
    ],
  ],
  [
    "kitchen",
    10,
    pair("Clear your breakfast spot", "מפנים את מקום ארוחת הבוקר"),
    [
      pair("Ask where the dishes should go", "שואלים לאן להעביר את הכלים"),
      pair("Carry one safe item at a time", "נושאים פריט בטוח אחד בכל פעם"),
      pair("Wipe your place with a damp cloth", "מנגבים את המקום במטלית לחה"),
    ],
  ],
  [
    "room",
    15,
    pair("Pack tomorrow’s adventure bag", "מכינים את התיק למחר"),
    [
      pair(
        "Check tomorrow’s list with a grown-up",
        "בודקים את הרשימה למחר עם מבוגר",
      ),
      pair("Put in your books and pencil case", "מכניסים ספרים וקלמר"),
      pair("Leave your bag by the door", "מניחים את התיק ליד הדלת"),
    ],
  ],
  [
    "pet",
    10,
    pair("Refresh our pet’s water", "מרעננים מים לחיית המחמד"),
    [
      pair(
        "Ask a grown-up to help with the bowl",
        "מבקשים ממבוגר לעזור עם הקערה",
      ),
      pair("Add fresh drinking water together", "מוסיפים יחד מי שתייה טריים"),
      pair("Wipe any splashes from the floor", "מנגבים טיפות מים מהרצפה"),
    ],
  ],
  [
    "living",
    10,
    pair("Park the shoes in pairs", "מחנים את הנעליים בזוגות"),
    [
      pair("Find the shoes near the door", "מוצאים את הנעליים ליד הדלת"),
      pair("Match the left and right shoes", "מתאימים נעל ימין ושמאל"),
      pair(
        "Put the pairs on the shoe rack",
        "מניחים את הזוגות על מתקן הנעליים",
      ),
    ],
  ],
  [
    "room",
    15,
    pair("Sort the art supplies", "מסדרים את חומרי היצירה"),
    [
      pair("Put the lids back on the markers", "מחזירים מכסים לטושים"),
      pair("Group the pencils by colour", "ממיינים עפרונות לפי צבע"),
      pair("Stack the paper in its tray", "מסדרים את הנייר במגש"),
    ],
  ],
  [
    "cleaning",
    10,
    pair("Fold the little towels", "מקפלים את המגבות הקטנות"),
    [
      pair("Find the clean hand towels", "מוצאים מגבות ידיים נקיות"),
      pair("Fold each towel in half twice", "מקפלים כל מגבת לחצי פעמיים"),
      pair("Stack them on the low shelf", "מניחים בערימה על המדף הנמוך"),
    ],
  ],
  [
    "living",
    15,
    pair("Reset the board games", "מחזירים את משחקי הקופסה"),
    [
      pair("Collect the game pieces", "אוספים את חלקי המשחק"),
      pair("Check the pieces with a grown-up", "בודקים את החלקים עם מבוגר"),
      pair(
        "Close the boxes and put them away",
        "סוגרים קופסאות ומחזירים למקום",
      ),
    ],
  ],
  [
    "kitchen",
    15,
    pair("Make a fruit rainbow together", "מכינים יחד קשת של פירות"),
    [
      pair("Pick fruit with a grown-up", "בוחרים פירות עם מבוגר"),
      pair("Wash the fruit together", "שוטפים יחד את הפירות"),
      pair(
        "Arrange pieces after a grown-up cuts them",
        "מסדרים חתיכות אחרי שמבוגר חותך אותן",
      ),
    ],
  ],
  [
    "shopping",
    20,
    pair("Help unpack the groceries", "עוזרים לפרוק את הקניות"),
    [
      pair(
        "Ask which light items you can carry",
        "שואלים אילו פריטים קלים אפשר לשאת",
      ),
      pair("Carry them to the kitchen", "נושאים אותם למטבח"),
      pair("Ask where each item belongs", "שואלים לאן כל פריט שייך"),
    ],
  ],
  [
    "room",
    10,
    pair("Give the books a home", "מחזירים את הספרים הביתה"),
    [
      pair("Collect books from your room", "אוספים ספרים מהחדר"),
      pair("Close each book gently", "סוגרים כל ספר בעדינות"),
      pair("Line them up on the shelf", "מסדרים אותם על המדף"),
    ],
  ],
  [
    "living",
    10,
    pair("Fluff the sofa cushions", "מסדרים כריות בספה"),
    [
      pair("Pick the cushions up", "מרימים את הכריות"),
      pair("Give each cushion a gentle pat", "טופחים בעדינות על כל כרית"),
      pair("Put them back on the sofa", "מחזירים אותן לספה"),
    ],
  ],
  [
    "cleaning",
    15,
    pair("Sort the recycling together", "ממיינים יחד למחזור"),
    [
      pair(
        "Ask a grown-up for safe clean items",
        "מבקשים ממבוגר פריטים נקיים ובטוחים",
      ),
      pair("Separate paper from plastic", "מפרידים נייר מפלסטיק"),
      pair("Put them in the matching bins", "מניחים בפחים המתאימים"),
    ],
  ],
  [
    "room",
    10,
    pair("Choose tomorrow’s clothes", "בוחרים בגדים למחר"),
    [
      pair(
        "Check the weather with a grown-up",
        "בודקים את מזג האוויר עם מבוגר",
      ),
      pair("Choose a top and trousers", "בוחרים חולצה ומכנסיים"),
      pair("Add a matching pair of socks", "מוסיפים זוג גרביים"),
    ],
  ],
  [
    "kitchen",
    10,
    pair("Bring napkins to the table", "מביאים מפיות לשולחן"),
    [
      pair("Count the people eating", "סופרים כמה אנשים אוכלים"),
      pair("Take one napkin for each person", "לוקחים מפית לכל אחד"),
      pair("Put a napkin at every place", "מניחים מפית בכל מקום"),
    ],
  ],
  [
    "other",
    15,
    pair("Make a thank-you picture", "מציירים ציור תודה"),
    [
      pair("Think of someone who helped you", "חושבים על מישהו שעזר לכם"),
      pair("Draw a picture for them", "מציירים עבורם ציור"),
      pair("Tell them what you appreciated", "מספרים להם על מה אתם מודים"),
    ],
  ],
  [
    "living",
    10,
    pair("Fold the sofa blanket", "מקפלים את שמיכת הספה"),
    [
      pair("Spread the blanket on the sofa", "פורשים את השמיכה על הספה"),
      pair("Bring the corners together", "מצמידים את הפינות"),
      pair(
        "Put the folded blanket in its basket",
        "מניחים את השמיכה המקופלת בסל",
      ),
    ],
  ],
  [
    "homework",
    15,
    pair("Prepare a calm homework spot", "מכינים פינה לשיעורי בית"),
    [
      pair("Clear a space on the desk", "מפנים מקום על השולחן"),
      pair("Bring your pencil case and books", "מביאים קלמר וספרים"),
      pair(
        "Ask for help with your first question",
        "מבקשים עזרה בשאלה הראשונה",
      ),
    ],
  ],
  [
    "pet",
    20,
    pair("Join the family dog walk", "מצטרפים לטיול המשפחתי עם הכלב"),
    [
      pair(
        "Ask a grown-up when you can go together",
        "שואלים מבוגר מתי אפשר לצאת יחד",
      ),
      pair("Bring the bags and drinking water", "מביאים שקיות ומי שתייה"),
      pair(
        "Walk together and let the grown-up hold the lead",
        "מטיילים יחד והמבוגר מחזיק ברצועה",
      ),
    ],
  ],
];

export const DEMO_TREASURES = [
  [
    "🎬",
    30,
    0,
    pair("You pick the movie", "אתם בוחרים את הסרט"),
    pair(
      "The whole family watches your choice tonight.",
      "כל המשפחה צופה הערב בבחירה שלכם.",
    ),
  ],
  [
    "🍦",
    40,
    0,
    pair("Ice-cream outing", "יוצאים לגלידה"),
    pair(
      "Choose a flavour on our next family outing.",
      "בוחרים טעם ביציאה המשפחתית הבאה.",
    ),
  ],
  [
    "🎨",
    45,
    25,
    pair("Messy art afternoon", "אחר צהריים של יצירה"),
    pair(
      "Pick the paints. We’ll make something together.",
      "בחרו צבעים. נכין משהו ביחד.",
    ),
  ],
  [
    "📚",
    20,
    0,
    pair("One more bedtime story", "עוד סיפור לפני השינה"),
    pair(
      "An extra story, and you choose the book.",
      "עוד סיפור אחד, ואתם בוחרים את הספר.",
    ),
  ],
  [
    "🎮",
    60,
    50,
    pair("Player two: your grown-up", "משחקים עם המבוגר שלכם"),
    pair(
      "Choose a game for 30 minutes of playing together.",
      "בחרו משחק לחצי שעה של משחק משותף.",
    ),
  ],
  [
    "🍕",
    80,
    75,
    pair("Pizza chef for the night", "שפים של פיצה לערב"),
    pair(
      "Choose the toppings for our homemade pizza.",
      "בוחרים תוספות לפיצה הביתית שלנו.",
    ),
  ],
  [
    "🏕️",
    90,
    100,
    pair("Living-room campout", "מחנה בסלון"),
    pair(
      "Blankets, torches and a pretend wilderness.",
      "שמיכות, פנסים והרפתקה בדמיון.",
    ),
  ],
  [
    "🧺",
    100,
    100,
    pair("Pack a mystery picnic", "מכינים פיקניק הפתעה"),
    pair(
      "Choose a park and pack lunch together.",
      "בוחרים פארק ואורזים יחד ארוחת צהריים.",
    ),
  ],
  [
    "🎵",
    25,
    0,
    pair("You’re the car DJ", "אתם הדי-ג׳יי באוטו"),
    pair(
      "Choose the music for our next car ride.",
      "בוחרים את המוזיקה לנסיעה הבאה שלנו.",
    ),
  ],
  [
    "🪁",
    120,
    120,
    pair("Fly a kite together", "מעיפים יחד עפיפון"),
    pair(
      "Take our kite out on the next breezy day.",
      "יוצאים עם העפיפון ביום הבא עם רוח נעימה.",
    ),
  ],
  [
    "🧩",
    70,
    50,
    pair("Family game captain", "קפטן ערב המשחקים"),
    pair(
      "Choose the game and the teams for game night.",
      "בוחרים משחק וקבוצות לערב המשחקים.",
    ),
  ],
  [
    "🧁",
    110,
    150,
    pair("Cupcake workshop", "סדנת קאפקייקס"),
    pair(
      "Bake with a grown-up, then decorate your creation.",
      "אופים עם מבוגר ואז מקשטים את היצירה שלכם.",
    ),
  ],
  [
    "🔭",
    160,
    200,
    pair("An evening under the stars", "ערב מתחת לכוכבים"),
    pair(
      "A blanket and a grown-up to spot the constellations.",
      "שמיכה ומבוגר לצפייה בקבוצות הכוכבים.",
    ),
  ],
  [
    "🎟️",
    400,
    200,
    pair("A day at the science museum", "יום במוזיאון המדע"),
    pair(
      "Plan a family visit and choose the first exhibit.",
      "מתכננים ביקור משפחתי ובוחרים את התערוכה הראשונה.",
    ),
  ],
  [
    "🚲",
    750,
    250,
    pair("Choose our next bike trail", "בוחרים את מסלול האופניים"),
    pair(
      "Plan a safe family ride with your grown-up.",
      "מתכננים עם המבוגר טיול משפחתי בטוח.",
    ),
  ],
  [
    "🎠",
    500,
    800,
    pair("A theme-park adventure", "הרפתקה בפארק שעשועים"),
    pair(
      "Plan a special family day when everyone is free.",
      "מתכננים יום משפחתי מיוחד כשכולם פנויים.",
    ),
  ],
  [
    "🎧",
    550,
    1000,
    pair("Your next audiobook", "ספר ההאזנה הבא שלכם"),
    pair(
      "Choose a new story to listen to together.",
      "בוחרים סיפור חדש להאזנה משותפת.",
    ),
  ],
  [
    "🚀",
    650,
    1200,
    pair("Your big adventure day", "יום ההרפתקה הגדול שלכם"),
    pair(
      "Plan your own family day with a grown-up.",
      "מתכננים עם מבוגר יום משפחתי בבחירתכם.",
    ),
  ],
];

const pairs = [
  ...DEMO_MISSIONS.flatMap(([, , title, steps]) => [title, ...steps]),
  ...DEMO_TREASURES.flatMap(([, , , title, description]) => [
    title,
    description,
  ]),
];
export const PREVIEW_EN = Object.fromEntries(
  pairs.map(({ en, he }) => [he, en]),
);
export const PREVIEW_HE = Object.fromEntries(
  pairs.map(({ en, he }) => [en, he]),
);
