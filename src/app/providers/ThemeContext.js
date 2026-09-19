import { createContext, useContext } from "react";

export const ThemeContext = createContext(null);

export function useAppTheme() {
  return useContext(ThemeContext);
}
