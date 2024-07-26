import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  LogBox,
  Text,
  ActivityIndicator,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "@rneui/themed";
import { NotifyMessage, saveImg } from "../../utils/tools";
import AlertAsync from "react-native-alert-async";
import Toast from "react-native-toast-message";
import { Capitalize } from "../../utils/tools";
import { doc, getDoc } from "firebase/firestore";
import { db, functions } from "../../firebaseConfig";
import { ImageZoom } from "@likashefqet/react-native-image-zoom";
import {
  deleteFromUploaded,
  handleFavAndLikes,
} from "../../services/cloudFunctions";
import { httpsCallable } from "firebase/functions";
import { getStorage, ref } from "firebase/storage";
import { UpdateContext } from "../../context/updateArt";

const IGNORED_LOGS = [
  "Non-serializable values were found in the navigation state",
];

LogBox.ignoreLogs(IGNORED_LOGS);

const storage = getStorage();

const Fullscreen = ({ route }) => {
  const navigation = useNavigation();
  const { user, artworkId, fav, imgUrl, artistId } = route.params;

  // state for controlling fav icon, and responsible for passing the
  // most updated status back to artItem screen.
  const [updatedStatus, setUpdatedStatus] = useState(fav);
  const [showExtra, setShowExtra] = useState(true);
  const [icon, setIcon] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [artInfo, setArtInfo] = useState();
  const { fetchTrigger, setFetchTrigger } = useContext(UpdateContext);

  const myUser = user === artistId ? true : false;

  // fetch art metadata in Firestore using CLOUD FUNCTION
  const fetchMetadata = () => {
    const fetchMetaCallable = httpsCallable(functions, "fetchMetdata");
    fetchMetaCallable({ artworkId: artworkId }).then(async (res) => {
      setArtInfo(res.data["data"]);

      const artistDocRef = doc(db, "user", res.data["data"]["artistId"]);
      const docSnap = await getDoc(artistDocRef);

      if (docSnap.exists()) {
        setIcon(docSnap.data()["Info"]["icon"]);
      } else {
        console.log("No such document!");
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={() => {
          setShowExtra(!showExtra);
          route.params.onGoBack(updatedStatus);
        }}
      >
        <View style={styles.artistInfo}>
          <TouchableOpacity
            style={[styles.icon, { opacity: showExtra ? 1 : 0 }]}
            disabled={true}
          >
            <Image
              source={{ uri: isLoading ? "https://" : icon }}
              style={{
                flex: 1,
                resizeMode: "cover",
                width: 60,
                borderRadius: 60,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.artist, { opacity: showExtra ? 1 : 0 }]}
            disabled={true}
          >
            <Text
              style={[styles.artistText, { fontWeight: "bold", fontSize: 20 }]}
            >
              {isLoading ? "" : Capitalize(artInfo["artName"])}
            </Text>
            <Text style={[styles.artistText, { fontSize: 16 }]}>
              {isLoading ? "" : Capitalize(artInfo["artist"])}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.deleteButton,
            { opacity: showExtra && myUser && !isLoading ? 1 : 0 },
          ]}
          disabled={myUser ? false : true}
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
              // firstly check whether the target art is faved by the user,
              // if no: only remove it from UploadedArt
              // if yes: remove it from both FavArt & UploadedArt
              deleteFromUploaded(artJSON).then(() => {
                setFetchTrigger(!fetchTrigger);
                navigation.goBack();
                Toast.show({
                  type: "success",
                  text1: "Successfully deleted.",
                  position: "bottom",
                  visibilityTime: 2000,
                });
              });
            } else {
              return;
            }
          }}
        >
          <Icon name="delete" type="material" color="black" size={36} />
        </TouchableOpacity>

        {/* fullscreen of art */}
        {isLoading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: 50,
            }}
          >
            <Image
              source={require("../../assets/kurukuru.gif")}
              style={{ width: 150, height: 150 }}
            />
          </View>
        ) : (
          <ImageZoom
            isDoubleTapEnabled={true}
            isPinchEnabled={true}
            minPanPointers={1}
            source={{ uri: imgUrl }}
            style={{
              flex: 1,
              resizeMode: "contain",
              zIndex: 1,
            }}
          />
        )}
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        {/* save to local button */}
        <TouchableOpacity
          style={[styles.button, { opacity: showExtra && !isLoading ? 1 : 0 }]}
          disabled={showExtra ? false : true}
          onPress={() => saveImg(imgUrl, artworkId)}
        >
          <Icon name="download" type="material" color="black" size={24} />
        </TouchableOpacity>
        {/* fav/unfav button */}
        <TouchableOpacity
          style={[styles.button, { opacity: showExtra && !isLoading ? 1 : 0 }]}
          disabled={showExtra ? false : true}
          onPress={async () => {
            const handleJSON = {
              favStatus: updatedStatus,
              userId: user,
              imgUrl: artInfo["imgUrl"],
              artworkId: artworkId,
              value: updatedStatus ? -1 : 1,
            };

            // guest mode
            if (!user) {
              NotifyMessage("Sign in to use the Favourite function.");
              return;
            }
            // faved, delete now
            else if (updatedStatus) {
              const choice = await AlertAsync(
                "Caution❗",
                "Are you sure you want to remove this art from your favourited list?",
                [
                  { text: "Yes", onPress: () => "yes" },
                  { text: "No", onPress: () => Promise.resolve("no") },
                ],
                {
                  cancelable: true,
                  onDismiss: () => "no",
                }
              );
              if (choice === "yes") {
                handleFavAndLikes(handleJSON).then(() => {
                  setUpdatedStatus(false);
                  navigation.goBack();
                  Toast.show({
                    type: "success",
                    text1: "Successfully deleted.",
                    position: "top",
                    visibilityTime: 2000,
                  });
                });
              } else {
                return;
              }
            }
            // not faved, fav now
            else {
              handleFavAndLikes(handleJSON).then(() => setUpdatedStatus(true));
            }
          }}
        >
          <Icon
            name={updatedStatus ? "heart" : "hearto"}
            type="antdesign"
            color="#ff5152"
            size={24}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Fullscreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  button: {
    backgroundColor: "white",
    padding: 20,
    marginHorizontal: 4,
    borderRadius: 50,
  },
  buttonContainer: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    bottom: 10,
    paddingHorizontal: 10,
    width: "100%",
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 60,
    justifyContent: "center",
  },
  artistInfo: {
    flexDirection: "row",
    position: "absolute",
    top: 60,
    left: 8,
    zIndex: 2,
  },
  artist: {
    justifyContent: "center",
    paddingLeft: 10,
  },
  artistText: {
    color: "white",
  },
  deleteButton: {
    position: "absolute",
    justifyContent: "center",
    zIndex: 2,
    width: 60,
    height: 60,
    top: 60,
    right: 8,
    borderRadius: 60,
    backgroundColor: "#ff5152",
  },
});
