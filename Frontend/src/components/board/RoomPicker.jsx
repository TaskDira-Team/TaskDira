import { Armchair, BedDouble, Home, ListTodo, Utensils } from "lucide-react";
import PlaySelect from "../ui/PlaySelect";
import "./roomPicker.css";

const rooms = [
  ["all", Home, "Every room", "כל החדרים", "mint"],
  ["kitchen", Utensils, "Kitchen", "מטבח", "peach"],
  ["living", Armchair, "Living room", "סלון", "gold"],
  ["room", BedDouble, "Bedroom", "חדר שינה", "lilac"],
  ["other", ListTodo, "Around the house", "ברחבי הבית", "sky"],
];

export default function RoomPicker({ value, onChange, he }) {
  return (
    <PlaySelect
      value={value}
      onChange={onChange}
      dir={he ? "rtl" : "ltr"}
      className="room-picker"
      label={he ? "סינון לפי חדר" : "Filter by room"}
      options={rooms.map(([value, icon, en, heb, tone]) => ({
        value,
        icon,
        label: he ? heb : en,
        tone,
      }))}
    />
  );
}
