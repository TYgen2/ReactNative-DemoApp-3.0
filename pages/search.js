import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "../context/themeProvider";
import { Dropdown } from "react-native-element-dropdown";
import { TouchableOpacity } from "react-native-gesture-handler";
import SearchItem from "../components/searchItem";
import { Icon } from "@rneui/themed";
import { FormatArtist, FormatName, GetHeaderHeight } from "../utils/tools";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";

const Search = ({ route }) => {
  const { colors } = useTheme();
  const { guest } = route.params;

  const options = [
    { label: "By name", value: "1" },
    { label: "By artist", value: "2" },
  ];
  const [value, setValue] = useState(1);
  const [initialArts, setInitialArts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [serach, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // fetch 10 initial arts using CLOUD FUNCTION, WORKING!!!
  const fetchArts = () => {
    const fetchCallable = httpsCallable(functions, "fetchArts");
    fetchCallable().then((res) => {
      setInitialArts(res.data["data"]);
      setIsLoading(false);
    });
  };

  const serachFilter = (text, mode) => {
    if (text) {
      const newData = artList.filter((art) => {
        const artName = FormatName(art.name);
        const artArtist = FormatArtist(art.name);

        const nameData = artName ? artName.toLowerCase() : "".toLowerCase();
        const artistData = artArtist
          ? artArtist.toLowerCase()
          : "".toLowerCase();
        const textData = text.toLowerCase();

        // mode for determine art filter search by name or artist
        // 1: name, 2: artist

        return mode == 1
          ? nameData.indexOf(textData) > -1
          : artistData.indexOf(textData) > -1;
      });
      setFiltered(newData);
      setSearch(text);
    } else {
      // default when no search text is typed
      setFiltered(artList);
      setSearch(text);
    }
  };

  const renderItem = ({ item }) => (
    <SearchItem
      guest={guest}
      artworkId={item["artworkID"]}
      artFilename={item["artFilename"]}
      artName={item["artName"]}
      artist={item["artist"]}
      artistId={item["artistId"]}
      imgUrl={item["imgUrl"]}
    />
  );

  useEffect(() => {
    fetchArts();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.title,
          { backgroundColor: colors.background, marginTop: GetHeaderHeight() },
        ]}
      >
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
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 8,
            top: -16,
          }}
        >
          <Dropdown
            placeholderStyle={{ color: "#0096FF", fontSize: 14 }}
            selectedTextStyle={{ color: "#0096FF", fontSize: 14 }}
            containerStyle={{ borderRadius: 10 }}
            itemContainerStyle={{
              width: 90,
              alignSelf: "center",
            }}
            itemTextStyle={{
              fontSize: 14,
            }}
            data={options}
            labelField="label"
            valueField="value"
            placeholder="By name"
            value={value}
            onChange={(item) => {
              setValue(item.value);
            }}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar]}>
        <Icon
          name="search"
          type="material"
          style={styles.searchIcon}
          color={colors.subtitle}
        />
        <TextInput
          autoCapitalize="none"
          style={styles.textInput}
          placeholder={value == "1" ? "e.g. chlorine " : "e.g. torino "}
          placeholderTextColor={colors.subtitle}
          fontWeight="bold"
          value={serach}
          onChangeText={(text) => serachFilter(text, value)}
        />
      </View>
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
          data={filtered.length != 0 ? filtered : initialArts}
          overScrollMode="never"
          renderItem={renderItem}
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
