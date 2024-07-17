import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/themeProvider";
import SearchItem from "../components/searchItem";
import { Icon } from "@rneui/themed";
import { GetHeaderHeight } from "../utils/tools";
import { useSearchBox, useInfiniteHits } from "react-instantsearch-core";

const Search = ({ route }) => {
  const { colors } = useTheme();
  const { guest } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [hitsInitialized, setHitsInitialized] = useState(false);

  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef(null);

  const setQuery = (newQuery) => {
    setInputValue(newQuery);
    refine(newQuery);
  };

  const { hits, isLastPage, showMore } = useInfiniteHits({
    escapeHTML: false,
  });

  if (query !== inputValue && !inputRef.current?.isFocused()) {
    setInputValue(query);
  }

  const renderItem = ({ item }) => (
    <SearchItem
      guest={guest}
      artworkId={item["artworkId"]}
      artFilename={item["artFilename"]}
      artName={item["artName"]}
      artist={item["artist"]}
      artistId={item["artistId"]}
      imgUrl={item["imgUrl"]}
    />
  );

  useEffect(() => {
    if (hits.length > 0 && !hitsInitialized) {
      setIsLoading(false);
      setHitsInitialized(true);
    }
  }, [hits, hitsInitialized]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.title,
          { backgroundColor: colors.background, marginTop: GetHeaderHeight() },
        ]}
      >
        {/* title */}
        <Text
          style={{
            fontWeight: "bold",
            color: colors.title,
            fontSize: 24,
            paddingLeft: 16,
          }}
        >
          Search for an Artwork
        </Text>
      </View>

      <View style={[styles.searchBar]}>
        <Icon
          name="search"
          type="material"
          style={styles.searchIcon}
          color={colors.subtitle}
        />
        <TextInput
          ref={inputRef}
          autoCapitalize="none"
          style={styles.textInput}
          placeholder="e.g. chlorine "
          placeholderTextColor={colors.subtitle}
          fontWeight="bold"
          value={inputValue}
          onChangeText={setQuery}
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
        />
      </View>

      {/* filtered artList */}
      <View style={styles.searchContent}>
        <FlatList
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View
              style={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#483C32" />
              ) : (
                <Text style={[styles.noMatch, { color: colors.subtitle }]}>
                  No match found
                </Text>
              )}
            </View>
          }
          data={hits}
          overScrollMode="never"
          renderItem={renderItem}
          onEndReached={() => {
            if (!isLastPage) {
              showMore();
            }
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "green",
  },
  searchBar: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  textInput: {
    paddingHorizontal: 10,
    fontSize: 16,
    paddingRight: 200,
  },
  searchContent: {
    flex: 18,
  },
  noMatch: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchIcon: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 20,
  },
});

export default Search;
