import { ConfigProvider, theme as antdTheme } from "antd";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import { darkTheme, lightTheme } from "../../constants/theme.js";
import { store } from "../store/store.js";
import { ThemeContext } from "./ThemeContext.js";

export function AppProviders({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("nuru-theme") || "light";
  });
  const isDark = mode === "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem("nuru-theme", mode);
  }, [mode]);

  const theme = isDark
    ? { ...darkTheme, algorithm: antdTheme.darkAlgorithm }
    : { ...lightTheme, algorithm: antdTheme.defaultAlgorithm };

  return (
    <Provider store={store}>
      <ThemeContext.Provider
        value={{
          mode,
          isDark,
          toggleTheme: () =>
            setMode((value) => (value === "dark" ? "light" : "dark")),
        }}
      >
        <ConfigProvider theme={theme}>
          <BrowserRouter>{children}</BrowserRouter>
        </ConfigProvider>
      </ThemeContext.Provider>
    </Provider>
  );
}
