import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { FlatList } from "react-native-gesture-handler";
import FavItem from "../../components/favItem";
import { db, functions } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../context/themeProvider";
import { GetHeaderHeight, Uncapitalize, sleep } from "../../utils/tools";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { DelArt } from "../../services/fav";
import { useSelector } from "react-redux";
import { httpsCallable } from "firebase/functions";
import { invalidFavRemoval } from "../../services/cloudFunctions";

const storage = getStorage();

const Favourites = () => {
  const { colors } = useTheme();
  const { user, isGuest } = useSelector((state) => state.user);

  const [favList, setFavList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // fetch art metadata in Firestore using CLOUD FUNCTION
  const fetchMetadata = async (artworkId) => {
    const fetchMetaCallable = httpsCallable(functions, "fetchMetdata");
    const res = await fetchMetaCallable({ artworkId: artworkId });
    const filenameData = res.data["data"]["artFilename"];
    return filenameData;
  };

  // fetch fav art in Firestore using CLOUD FUNCTION
  const fetchFav = async () => {
    const fetchCallable = httpsCallable(functions, "fetchFav");
    const res = await fetchCallable({ userId: user });
    setFavList(res.data["favData"]);
  };

  const checkArtExists = async (artRef) => {
    try {
      const response = await getDownloadURL(artRef);

      // file with same name already exist
      if (response) {
        return true;
      }
    } catch (e) {
      return false;
    }
  };

  const checkValidFav = async () => {
    // delete art from Fav if the original art doesn't exist anymore
    favList.forEach(async (item) => {
      const filename = await fetchMetadata(item["artworkId"]);
      const artRefs = ref(storage, `arts/${filename}`);

      checkArtExists(artRefs).then((res) => {
        // art has been deleted from the artist, proceed to delete it from Fav
        if (!res) {
          const handleJSON = {
            userId: user,
            imgUrl: item["imgUrl"],
            artworkId: item["artworkId"],
          };
          invalidFavRemoval(handleJSON);
        }
      });
    });

    console.log("All arts are valid");
  };

  const renderItem = ({ item }) => (
    <FavItem imgUrl={item["imgUrl"]} artworkId={item["artworkId"]} />
  );

  // when doc changes (user delete or add favourite to Firestore),
  // favList will be updated accordingly.
  useEffect(() => {
    let unsubscribe;
    if (!isGuest) {
      fetchFav().then(() => checkValidFav());

      const docRef = doc(db, "user", user);
      unsubscribe = onSnapshot(docRef, (doc) => {
        setFavList(doc.data()["FavArt"]);
      });
    }
    return () => unsubscribe && unsubscribe();
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
