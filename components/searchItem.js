import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Capitalize } from "../utils/tools";
import { useTheme } from "../context/themeProvider";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useEffect, useState } from "react";

export default searchItem = ({
  guest,
  artworkId,
  artFilename,
  artName,
  artist,
  artistId,
  imgUrl,
}) => {
  const navigation = useNavigation();
  const userId = guest ? null : auth.currentUser.uid;

  const { colors } = useTheme();

  const [artistIcon, setArtistIcon] = useState("");
  const [artistSign, setArtistSign] = useState("");

  const [status, setStatus] = useState(false);
  const [iconLoading, setIconLoading] = useState(false);

  const getInfo = async () => {
    setIconLoading(true);
    const artistDocRef = doc(db, "user", artistId);
    const docSnap = await getDoc(artistDocRef);

    if (docSnap.exists()) {
      setArtistIcon(docSnap.data()["Info"]["icon"]);
      setArtistSign(docSnap.data()["Info"]["sign"]);
    } else {
      console.log("No such document!");
    }
    setIconLoading(false);
  };

  if (!guest) {
    const docRef = doc(db, "user", userId);

    useEffect(() => {
      getInfo();
      const unsubscribe = onSnapshot(docRef, (doc) => {
        getInfo();
        if (doc.data()["FavArt"].some((e) => e["imgUrl"] === imgUrl)) {
          setStatus(true);
        } else {
          setStatus(false);
        }
      });

      return () => unsubscribe();
    }, [imgUrl]);
  } else {
    useEffect(() => {
      getInfo();
    }, [imgUrl]);
  }

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() =>
        navigation.navigate("Full art", {
          user: guest ? null : userId,
          artworkId: artworkId,
          fav: status,
          imgUrl: imgUrl,
          onGoBack: (updatedStatus) => {
            setStatus(updatedStatus);
          },
        })
      }
    >
      <TouchableOpacity
        onPress={() => {
          navigation.push("Profile", {
            user: userId,
            guest: guest,
            id: artistId,
            name: artist,
            sign: artistSign,
            icon: artistIcon,
          });
        }}
        style={{
          width: 40,
          height: 40,
          alignSelf: "center",
        }}
      >
        {artistIcon === "" || iconLoading ? (
          <ActivityIndicator size="small" color="#483C32" />
        ) : (
          <Image
            source={{ uri: artistIcon }}
            style={{
              flex: 1,
              resizeMode: "cover",
              width: 40,
              borderRadius: 40,
            }}
          />
        )}
      </TouchableOpacity>
      <View style={styles.artInfo}>
        <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.title }}>
          {Capitalize(artName)}
        </Text>
        <Text style={{ fontSize: 14, color: colors.subtitle }}>
          {Capitalize(artist)}
        </Text>
      </View>
      <Image source={{ uri: imgUrl }} style={{ flex: 2 }} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    height: 150,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
  },
  artInfo: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: "center",
  },
});
