import "react-native-gesture-handler";
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import NavStack from "./navigations/stack";
import Toast from "react-native-toast-message";
import { ThemeProvider } from "./context/themeProvider";

export default function App() {
  const error = console.error;
  console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };
  return (
    <ThemeProvider>
      <NavigationContainer>
        <NavStack />
        <Toast />
      </NavigationContainer>
    </ThemeProvider>
  );
}
