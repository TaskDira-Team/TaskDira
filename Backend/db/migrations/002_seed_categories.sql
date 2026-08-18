INSERT INTO categories (name, description)
SELECT v.name, v.description
FROM (VALUES
    ('מטבח',       'kitchen'),
    ('סלון',        'living'),
    ('קניות',       'shopping'),
    ('ניקיון',      'cleaning'),
    ('בישול',       'cooking'),
    ('חדר',         'room'),
    ('שיעורי בית',  'homework'),
    ('חיות',        'pet'),
    ('תחזוקה',      'maintenance'),
    ('אשפה',        'trash'),
    ('אחר',         'other')
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.description = v.description
);
