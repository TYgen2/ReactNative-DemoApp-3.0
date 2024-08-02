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
import { doc, getDoc } from "firebase/firestore";
import { db, functions } from "../firebaseConfig";
import { useContext, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { UpdateContext } from "../context/updateArt";

export default searchItem = ({
  user,
  guest,
  artworkId,
  artName,
  artist,
  artistId,
  imgUrl,
}) => {
  const navigation = useNavigation();

  const { colors } = useTheme();

  const [artistIcon, setArtistIcon] = useState("");
  const [artistSign, setArtistSign] = useState("");

  const [status, setStatus] = useState(false);
  const [iconLoading, setIconLoading] = useState(true);
  const { fetchTrigger, setFetchTrigger, searchTrigger, setSearchTrigger } =
    useContext(UpdateContext);

  const getInfo = async () => {
    const artistDocRef = doc(db, "user", artistId);
    const docSnap = await getDoc(artistDocRef);

    if (docSnap.exists()) {
      setArtistIcon(docSnap.data()["Info"]["icon"]);
      setArtistSign(docSnap.data()["Info"]["sign"]);
    } else {
      console.log("No such document!");
    }

    fetchFavAndLikes();
  };

  // get initial fav status from user Firestore FavArt
  const fetchFavAndLikes = async () => {
    const fetchCallable = httpsCallable(functions, "fetchFavAndLikes");
    const checkFavStatus = (favData) => {
      if (!favData) return false;
      return favData.some((art) => art["imgUrl"] === imgUrl);
    };

    fetchCallable({ userId: user, artworkId: artworkId, guest: guest })
      .then((res) => {
        setStatus(checkFavStatus(res.data["favData"]));
      })
      .then(() => setIconLoading(false));
  };

  useEffect(() => {
    getInfo();
  }, [searchTrigger, imgUrl]);

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() =>
        navigation.navigate("Full art", {
          user: user,
          artistId: "",
          artworkId: artworkId,
          fav: status,
          imgUrl: imgUrl,
          onGoBack: (updatedStatus, updatedLike) => {
            setStatus(updatedStatus);
            setFetchTrigger(!fetchTrigger);
          },
        })
      }
    >
      <TouchableOpacity
        onPress={() => {
          navigation.push("Profile", {
            user: user,
            guest: guest,
            artistId: artistId,
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
      {iconLoading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="small" color="#483C32" />
        </View>
      ) : (
        <Image source={{ uri: imgUrl }} style={{ flex: 2 }} />
      )}
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
