import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { FlatList } from "react-native-gesture-handler";
import FavItem from "../../components/favItem";
import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../context/themeProvider";
import { GetHeaderHeight, Uncapitalize, sleep } from "../../utils/tools";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { DelArt } from "../../services/fav";

const storage = getStorage();

const Favourites = ({ route }) => {
  const { colors } = useTheme();
  const { user } = route.params;
  const [isGuest, setGuest] = useState(auth.currentUser.isAnonymous);

  const [favList, setFavList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);
    // delete art from Fav if the original art doesn't exist anymore
    favList.forEach((item) => {
      const filename =
        Uncapitalize(item["artName"]) +
        "_" +
        Uncapitalize(item["artist"]) +
        ".jpg";
      const artRefs = ref(storage, `arts/${filename}`);

      checkArtExists(artRefs).then((res) => {
        // art has been deleted from the artist, proceed to delete it from Fav
        if (!res) {
          DelArt(user, item);
        }
      });
    });

    await sleep(1000);
    setIsLoading(false);
  };

  if (!isGuest) {
    const docRef = doc(db, "user", user);

    // when doc changes (user delete or add favourite to Firestore),
    // favList will be updated accordingly.
    useEffect(() => {
      // checkValidFav();

      const unsubscribe = onSnapshot(docRef, async (doc) => {
        setFavList(doc.data()["FavArt"]);
        await sleep(1000);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }, [favList.length]);

    const renderItem = ({ item }) => (
      <FavItem
        userId={user}
        artistId=""
        imgUrl={item["imgUrl"]}
        artworkId={item["artworkId"]}
      />
    );

    return (
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
    );
  }
  // guest mode
  else {
    return (
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
  }
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
