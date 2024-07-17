import "react-native-gesture-handler";
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import NavStack from "./navigations/stack";
import Toast from "react-native-toast-message";
import { ThemeProvider } from "./context/themeProvider";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-core";

const searchClient = algoliasearch(
  "W0PCNV7SEO",
  "da2996dd1f294fc88d15825bc6ee84a5"
);

export default function App() {
  const error = console.error;
  console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };
  return (
    <ThemeProvider>
      <NavigationContainer>
        <InstantSearch searchClient={searchClient} indexName="illustrations">
          <NavStack />
          <Toast />
        </InstantSearch>
      </NavigationContainer>
    </ThemeProvider>
  );
}
