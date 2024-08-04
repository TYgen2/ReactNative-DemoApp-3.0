import { Icon } from "@rneui/themed";
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { React, useState, useEffect, useContext } from "react";
import { NotifyMessage, Capitalize } from "../utils/tools";
import { db, functions } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { handleFavAndLikes } from "../services/cloudFunctions";
import { UpdateContext } from "../context/updateArt";
import { httpsCallable } from "firebase/functions";

const artItem = ({
  user,
  guest,
  width,
  left,
  top,
  bottom,
  artworkId,
  artName,
  artist,
  artistId,
  imgUrl,
}) => {
  const navigation = useNavigation();
  const userId = guest ? null : user;

  const [artistIcon, setArtistIcon] = useState("");
  const [artistSign, setArtistSign] = useState("");

  // state for controlling the fav icon based on Firestore
  const [status, setStatus] = useState();
  const [likes, setLikes] = useState();

  // making sure art, artist profile icon and likes are all rendered
  const [itemLoading, setItemLoading] = useState(true);
  const { searchTrigger, setSearchTrigger } = useContext(UpdateContext);

  // get art info
  const getInfo = async () => {
    const artistDocRef = doc(db, "user", artistId);
    const docSnap = await getDoc(artistDocRef);

    if (docSnap.exists()) {
      setArtistIcon(docSnap.data()["Info"]["icon"]);
      setArtistSign(docSnap.data()["Info"]["sign"]);
    } else {
      console.log("something wrong");
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
        setLikes(res.data["likeData"]);
        setStatus(checkFavStatus(res.data["favData"]));
      })
      .then(() => setItemLoading(false));
  };

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <View style={[styles.artList, { marginLeft: left }]}>
      {/* fullscreen art */}
      <TouchableOpacity
        style={styles.arts}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate("Full art", {
            user: userId,
            isGuest: guest,
            artistId: "",
            artworkId: artworkId,
            fav: status,
            imgUrl: imgUrl,
            onGoBack: (updatedStatus, updatedLike) => {
              setStatus(updatedStatus);
              setLikes(updatedLike === "minus" ? likes - 1 : likes + 1);
            },
          });
        }}
      >
        {itemLoading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#483C32" />
          </View>
        ) : (
          <Image
            source={{ uri: itemLoading ? "https://" : imgUrl }}
            style={{ flex: 1, width: width }}
          />
        )}
      </TouchableOpacity>
      <View style={[styles.artsInfo, { width: width }]}>
        {itemLoading ? (
          <View style={{ marginLeft: 30 }}>
            <ActivityIndicator size="small" color="#483C32" />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              navigation.push("Profile", {
                user: userId,
                guest: guest,
                artistId: artistId,
                name: artist,
                sign: artistSign,
                icon: artistIcon,
              });
            }}
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: 50,
              height: 50,
              paddingLeft: 20,
            }}
          >
            <Image
              source={{ uri: itemLoading ? "https://" : artistIcon }}
              style={{
                flex: 1,
                resizeMode: "cover",
                width: 50,
                borderRadius: 40,
              }}
            />
          </TouchableOpacity>
        )}

        <View
          style={{
            flex: 8,
            paddingLeft: 20,
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <Text style={styles.artName}>{Capitalize(artName)}</Text>
          <Text style={styles.artistName}>{Capitalize(artist)}</Text>
        </View>
        {itemLoading ? (
          <View style={{ marginRight: 15 }}>
            <ActivityIndicator size="small" color="#483C32" />
          </View>
        ) : (
          <View
            style={{ marginRight: 16, marginTop: top, marginBottom: bottom }}
          >
            <Text style={styles.like}>{likes}</Text>
            <TouchableOpacity
              style={styles.favButton}
              onPress={() => {
                const handleJSON = {
                  favStatus: status,
                  userId: userId,
                  imgUrl: imgUrl,
                  artworkId: artworkId,
                  value: status ? -1 : 1,
                };

                if (guest) {
                  NotifyMessage("Sign in to use the Favourite function.");
                  return;
                } else {
                  setLikes(status ? likes - 1 : likes + 1);
                  setStatus(!status);
                  handleFavAndLikes(handleJSON).then(() =>
                    setSearchTrigger(!searchTrigger)
                  );
                }
              }}
            >
              <Icon
                name={status ? "heart" : "hearto"}
                type="antdesign"
                size={24}
                color="#ff5152"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  artList: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginVertical: 0,
  },
  arts: {
    flex: 6,
  },
  artsInfo: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "black",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },
  artName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    overflow: "hidden",
  },
  artistName: {
    color: "white",
    fontSize: 14,
    overflow: "hidden",
  },
  favButton: {
    flex: 1,
    borderRadius: 30,
    justifyContent: "center",
  },
  like: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    color: "#ff5152",
  },
});

export default artItem;
