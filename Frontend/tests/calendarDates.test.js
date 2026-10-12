import test from "node:test";
import assert from "node:assert/strict";
import {
  addCalendarDays,
  calendarMonth,
  formatCalendarDate,
  parseCalendarDate,
  shiftCalendarMonth,
} from "../src/utils/calendarDates.js";

test("date-only calendar arithmetic crosses month, year and leap-day boundaries", () => {
  assert.equal(addCalendarDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addCalendarDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addCalendarDays("2026-03-29", 1), "2026-03-30");
  assert.equal(shiftCalendarMonth("2026-01-31", 1), "2026-02-28");
  assert.equal(shiftCalendarMonth("2028-01-31", 1), "2028-02-29");
  assert.equal(shiftCalendarMonth("2028-02-29", -12), "2027-02-28");
});

test("calendar weeks stay aligned in Hebrew and English, including six-week months", () => {
  const hebrew = calendarMonth("2026-10-22", 0);
  const english = calendarMonth("2026-10-22", 1);
  assert.equal(hebrew[0], "2026-09-27");
  assert.equal(english[0], "2026-09-28");
  assert.equal(hebrew.length, 35);
  assert.equal(calendarMonth("2026-08-01", 0).length, 42);
  assert.equal(new Set(hebrew).size, hebrew.length);
  assert.equal(hebrew.filter((date) => date.startsWith("2026-10")).length, 31);
});

test("invalid dates are rejected and translated labels preserve the promised day", () => {
  for (const invalid of [
    "",
    "2026-02-29",
    "2026-13-01",
    "2026-4-01",
    "not-a-date",
  ])
    assert.equal(parseCalendarDate(invalid), null);
  assert.equal(
    formatCalendarDate("2026-10-22", "en-GB", { weekday: "long" }),
    "Thursday",
  );
  assert.equal(
    formatCalendarDate("2026-10-22", "he-IL", { weekday: "long" }),
    "יום חמישי",
  );
});
