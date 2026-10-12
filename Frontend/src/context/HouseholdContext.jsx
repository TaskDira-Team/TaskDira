import { AppProvider } from "./AppContext";
import { PlayProvider } from "./PlayContext";
export { useApp as useHousehold, AppProvider, useApp } from "./AppContext";
export function HouseholdProvider({ children }) {
  return (
    <AppProvider>
      <PlayProvider>{children}</PlayProvider>
    </AppProvider>
  );
}
