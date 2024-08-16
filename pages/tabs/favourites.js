import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { FlatList } from "react-native-gesture-handler";
import FavItem from "../../components/favItem";
import { db, functions } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../context/themeProvider";
import { GetHeaderHeight } from "../../utils/tools";
import { useSelector } from "react-redux";
import { httpsCallable } from "firebase/functions";
import { invalidFavRemoval } from "../../services/cloudFunctions";

const Favourites = () => {
  const { colors } = useTheme();
  const { user, isGuest } = useSelector((state) => state.user);

  const [favList, setFavList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // fetch art metadata in Firestore using CLOUD FUNCTION
  const fetchMetadata = async (artworkId) => {
    const fetchMetaCallable = httpsCallable(functions, "fetchMetdata");
    const res = await fetchMetaCallable({ artworkId: artworkId });
    return res.data;
  };

  // fetch fav art in Firestore using CLOUD FUNCTION
  const fetchAndCheck = async () => {
    if (!isGuest) {
      const fetchCallable = httpsCallable(functions, "fetchFav");
      const res = await fetchCallable({ userId: user });
      let tmpList = res.data["favData"];
      const validItems = [];

      await Promise.all(
        tmpList.map(async (art) => {
          const valid = await fetchMetadata(art["artworkId"]);
          if (valid["data"] != null) {
            validItems.push(art);
          } else {
            const handleJSON = {
              userId: user,
              imgUrl: art["imgUrl"],
              artworkId: art["artworkId"],
            };
            await invalidFavRemoval(handleJSON);
          }
        })
      );
      console.log("Arts validation done");

      setFavList(validItems);
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <FavItem imgUrl={item["imgUrl"]} artworkId={item["artworkId"]} />
  );

  // when doc changes (user delete or add favourite to Firestore),
  // favList will be updated accordingly.
  useEffect(() => {
    const fetchDataAndSetupListener = async () => {
      await fetchAndCheck(); // Make sure this completes first

      if (!isGuest) {
        const docRef = doc(db, "user", user);
        const delay = 5000; // 5 seconds

        const unsubscribe = setTimeout(() => {
          const unsubscribeListener = onSnapshot(docRef, (doc) => {
            setFavList(doc.data()["FavArt"]);
          });

          // Clean up the listener when the component unmounts or dependencies change
          return () => unsubscribeListener();
        }, delay);

        return () => clearTimeout(unsubscribe); // Clear the timeout if the component unmounts
      }
    };
    fetchDataAndSetupListener();
  }, []);

  return !isGuest ? (
    <View style={[styles.container, { marginTop: GetHeaderHeight() }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.title }]}>
          My Favourites ❤
        </Text>
      </View>
      <View style={styles.artContent}>
        <FlatList
          // when favList is empty
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#483C32" />
              ) : (
                <View
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={[styles.subTitle, { color: colors.title }]}>
                    No favourited art yet
                  </Text>
                  <Text style={{ color: colors.subtitle }}>
                    Too many choices? Try out the Random function!
                  </Text>
                </View>
              )}
            </View>
          }
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 4,
          }}
          contentContainerStyle={{ flexGrow: 1 }}
          overScrollMode="never"
          horizontal={false}
          data={favList}
          numColumns={2}
          renderItem={renderItem}
        />
      </View>
    </View>
  ) : (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.artContent,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={[styles.subTitle, { color: colors.title }]}>Opps!</Text>
        <Text style={{ color: colors.subtitle }}>
          Sign in to use the Favourites function.
        </Text>
      </View>
    </View>
  );
};

export default Favourites;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    paddingLeft: 24,
  },
  artContent: {
    flex: 12,
    justifyContent: "center",
  },
  subTitle: {
    fontWeight: "bold",
    fontSize: 30,
    paddingBottom: 10,
  },
});
