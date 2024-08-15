import "react-native-gesture-handler";
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import NavStack from "./navigations/stack";
import Toast from "react-native-toast-message";
import { ThemeProvider } from "./context/themeProvider";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-core";
import { persistor, store } from "./store/store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

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
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <NavigationContainer>
            <InstantSearch
              searchClient={searchClient}
              indexName="illustrations"
            >
              <NavStack />
              <Toast />
            </InstantSearch>
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
}
