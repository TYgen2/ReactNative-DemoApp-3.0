import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  ActivityIndicator,
} from "react-native";
import { React, useContext, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { functions } from "../firebaseConfig";
import { getStorage, ref } from "firebase/storage";
import AlertAsync from "react-native-alert-async";
import { Icon } from "@rneui/themed";
import { UpdateContext } from "../context/updateArt";
import Toast from "react-native-toast-message";
import { deleteFromUploaded } from "../services/cloudFunctions";
import { httpsCallable } from "firebase/functions";

const windowWidth = Dimensions.get("window").width;
const storage = getStorage();

const UploadItem = ({ imgUrl, artworkId, guest, user, artistId }) => {
  const navigation = useNavigation();
  const [status, setStatus] = useState(false);
  const [likes, setLikes] = useState();
  const [likeLoading, setLikeLoading] = useState(true);

  const { fetchTrigger, setFetchTrigger } = useContext(UpdateContext);

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
      .then(() => setLikeLoading(false));
  };

  // load likes count from Firestore
  useEffect(() => {
    fetchFavAndLikes();
  }, []);

  return (
    <View style={styles.artList}>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate("Full art", {
            user: guest ? null : user,
            isGuest: guest,
            artistId: artistId,
            artworkId: artworkId,
            fav: status,
            imgUrl: imgUrl,
            onGoBack: (updatedStatus, updatedLike) => {
              setStatus(updatedStatus);
              setLikes(updatedLike === "minus" ? likes - 1 : likes + 1);
              setFetchTrigger(!fetchTrigger);
            },
          });
        }}
      >
        <Image source={{ uri: imgUrl }} style={{ flex: 1 }} />
        <View style={styles.likesContainer}>
          <Icon
            name="heart"
            type="antdesign"
            color="#ff5152"
            size={10}
            style={{ paddingTop: 2 }}
          />
          {likeLoading ? (
            <ActivityIndicator size={14} color="#ff5152" />
          ) : (
            <Text style={styles.likes}>{" " + likes}</Text>
          )}
        </View>
        {/*NO IN USE TEMP*/}
        <TouchableOpacity
          onPress={async () => {
            const fileRef = ref(storage, imgUrl);

            const artJSON = {
              userId: user,
              artworkId: artworkId,
              imgUrl: imgUrl,
              imgPath: fileRef.fullPath,
            };

            const choice = await AlertAsync(
              "Caution❗",
              "Are you sure you want to delete this art permanently?",
              [
                { text: "Yes", onPress: () => "yes" },
                { text: "No", onPress: () => Promise.resolve("no") },
              ],
              {
                cancelable: true,
                onDismiss: () => {
                  "no";
                },
              }
            );
            // deletion
            if (choice === "yes") {
              // set loading in random page = true to prevent art undefined
              // setRanLoading(true);

              // firstly check whether the target art is faved by the user,
              // if no: only remove it from UploadedArt
              // if yes: remove it from both FavArt & UploadedArt
              deleteFromUploaded(artJSON);
              setFetchTrigger(!fetchTrigger);

              Toast.show({
                type: "success",
                text1: "Successfully deleted.",
                position: "bottom",
                visibilityTime: 2000,
              });
            } else {
              return;
            }
          }}
        ></TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

export default UploadItem;

const styles = StyleSheet.create({
  artList: {
    width: windowWidth / 3,
    height: windowWidth / 3,
    padding: 1,
  },
  deleteConfirm: {
    borderRadius: 80,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#EADDCA",
    justifyContent: "center",
  },
  likesContainer: {
    width: 40,
    height: 20,
    paddingLeft: 2,
    margin: 1,
    flexDirection: "row",
    borderRadius: 10,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    bottom: 0,
    right: 0,
  },
  likes: {
    color: "#ff5152",
    fontSize: 12,
    fontWeight: "bold",
  },
});
