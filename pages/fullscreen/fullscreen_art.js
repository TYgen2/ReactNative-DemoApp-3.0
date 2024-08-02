import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  LogBox,
  Text,
  ActivityIndicator,
} from "react-native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  addComment,
  deleteFromUploaded,
  handleFavAndLikes,
  likeComment,
} from "../../services/cloudFunctions";
import { httpsCallable } from "firebase/functions";
import { getStorage, ref } from "firebase/storage";
import { UpdateContext } from "../../context/updateArt";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/themeProvider";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import CommentItem from "../../components/commentItem";

const IGNORED_LOGS = [
  "Non-serializable values were found in the navigation state",
];

LogBox.ignoreLogs(IGNORED_LOGS);

const storage = getStorage();

const Fullscreen = ({ route }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, artworkId, fav, imgUrl, artistId, onGoBack } = route.params;

  // state for controlling fav icon, and responsible for passing the
  // most updated status back to artItem screen.
  const [updatedStatus, setUpdatedStatus] = useState(fav);
  const [showExtra, setShowExtra] = useState(false);
  const [icon, setIcon] = useState("");
  const [userIcon, setUserIcon] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [artInfo, setArtInfo] = useState();
  const { fetchTrigger, setFetchTrigger, searchTrigger, setSearchTrigger } =
    useContext(UpdateContext);
  const [donwloading, setDownloading] = useState(false);
  const [comment, setComment] = useState("");
  const [commentList, setCommentList] = useState();

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
      setShowExtra(true);
    });
  };

  // fetch art comment in Firestore using CLOUD FUNCTION
  const fetchComment = async () => {
    const fetchMetaCallable = httpsCallable(functions, "getComment");
    fetchMetaCallable({ artworkId: artworkId, userId: user }).then(
      async (res) => {
        setCommentList(res.data["data"]);
      }
    );
  };

  const getUserInfo = async () => {
    const docRef = doc(db, "user", user);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setUserIcon(docSnap.data()["Info"]["icon"]);
    } else {
      console.log("No such document!");
    }
  };

  useEffect(() => {
    fetchMetadata();
    getUserInfo();
    fetchComment();
  }, []);

  // controlling the extra info view
  useEffect(() => {
    if (showExtra) {
      handleUpperExtra(0);
      handleOpenPress();
    } else {
      handleUpperExtra(-120);
      handleClosePress();
    }
  }, [showExtra]);

  const upperExtraY = useSharedValue(-120);
  const reanimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: upperExtraY.value }],
    };
  }, []);
  const handleUpperExtra = (y) => {
    upperExtraY.value = withTiming(y, { duration: 300 });
  };

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["15%", "60%"], []);

  const handleOpenPress = useCallback(() => {
    bottomSheetRef.current?.collapse();
  }, []);
  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 300,
    easing: Easing.inOut(Easing.quad),
  });

  const renderItem = useCallback(
    ({ item }) => (
      <CommentItem
        createdTime={item["createdTime"]}
        commenterIcon={item["commenterData"]["icon"]}
        commenterName={item["commenterData"]["name"]}
        commentFavData={item["favData"]}
        commentID={item["commentID"]}
        comment={item["comment"]}
        user={user}
        artworkId={artworkId}
      />
    ),
    []
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLoading ? "black" : showExtra ? "white" : "black",
        },
      ]}
    >
      <TouchableOpacity
        style={{ flex: 1, opacity: donwloading ? 0.4 : 1 }}
        activeOpacity={1}
      >
        {/* Upper Extra */}
        <Animated.View
          style={[
            styles.extra,
            reanimatedStyle,
            { backgroundColor: colors.fullscreenExtra },
          ]}
        >
          <View style={styles.artistInfo}>
            {/* artist icon */}
            <View style={styles.icon}>
              <Image
                source={{ uri: isLoading ? "https://" : icon }}
                style={{
                  flex: 1,
                  resizeMode: "cover",
                  width: 80,
                  borderRadius: 80,
                }}
              />
            </View>
            <View style={styles.artist}>
              {/* art name */}
              <Text
                style={[
                  { fontWeight: "bold", fontSize: 20, color: colors.title },
                ]}
              >
                {isLoading ? "" : Capitalize(artInfo["artName"])}
              </Text>
              {/* artist name */}
              <Text style={{ fontSize: 16, color: colors.title }}>
                {isLoading ? "" : Capitalize(artInfo["artist"])}
              </Text>
            </View>
            {/* fav button */}
            <TouchableOpacity
              style={styles.button}
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
                    onGoBack(false, "minus");

                    handleFavAndLikes(handleJSON).then(() => {
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
                  setUpdatedStatus(true);
                  onGoBack(true, "plus");

                  handleFavAndLikes(handleJSON);
                }
                // update search page fav status
                setSearchTrigger(!searchTrigger);
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
        </Animated.View>

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
            source={{ uri: imgUrl }}
            isDoubleTapEnabled={true}
            isPinchEnabled={true}
            isPanEnabled={true}
            minPanPointers={1}
            isSingleTapEnabled={true}
            onSingleTap={() => {
              setShowExtra(!showExtra);
            }}
          />
        )}
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        animationConfigs={animationConfigs}
        backgroundStyle={{
          backgroundColor: colors.fullscreenExtra,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        index={-1}
        handleIndicatorStyle={{ backgroundColor: colors.title }}
        enableOverDrag={false}
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={[styles.bottomSheet]}>
          <View style={{ flexDirection: "row", height: 100 }}>
            {/* Image description */}
            <View
              style={{ flex: 3, justifyContent: "center", marginRight: 20 }}
            >
              <Text style={[styles.imgDesc, { color: colors.title }]}>
                Image Description
              </Text>
              <Text style={{ color: colors.title }}>
                {isLoading ? "" : artInfo["artDescription"]}
              </Text>
            </View>

            {/* download & delete button container */}
            <View
              style={{
                flex: 1,
                justifyContent: "space-evenly",
              }}
            >
              {/* download button */}
              <TouchableOpacity
                style={[
                  styles.bottomRightBtns,
                  { backgroundColor: colors.uploadPreview },
                ]}
                onPress={() => {
                  setDownloading(true);
                  saveImg(imgUrl, artworkId).then(() => setDownloading(false));
                }}
              >
                <Icon name="download" type="material" color="black" size={24} />
              </TouchableOpacity>

              {/* delete button */}
              {myUser ? (
                <TouchableOpacity
                  style={[
                    styles.bottomRightBtns,
                    { backgroundColor: "#ff5152" },
                  ]}
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
                  <Icon name="delete" type="material" color="black" size={24} />
                </TouchableOpacity>
              ) : (
                <></>
              )}
            </View>
          </View>

          <View style={styles.lineBreak} />

          {/* comment section */}
          <Text style={[styles.commentTitle, { color: colors.title }]}>
            Comments
          </Text>
          <View
            style={{
              flex: 5,
              marginVertical: 10,
              justifyContent: "flex-start",
            }}
          >
            {/* <ActivityIndicator size="small" color="grey" /> */}
            <BottomSheetFlatList data={commentList} renderItem={renderItem} />
          </View>

          {/* write comment */}
          <View style={styles.commentInput}>
            <Image
              source={{ uri: isLoading ? "https://" : userIcon }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 40,
                marginLeft: 4,
                backgroundColor: "green",
              }}
            />

            <BottomSheetTextInput
              style={{
                flex: 1,
                marginLeft: 4,
                paddingVertical: 4,
                color: "white",
                borderBottomWidth: 1,
                borderBottomColor: "grey",
              }}
              selectionColor="grey"
              value={comment}
              placeholder="Write your comments here..."
              placeholderTextColor="grey"
              onChangeText={(text) => setComment(text)}
            />

            <TouchableOpacity
              onPress={() => {
                const commentJSON = {
                  userId: user,
                  comment: comment,
                  artworkId: artworkId,
                };
                addComment(commentJSON).then(() => {
                  fetchComment();
                  setComment("");
                });
              }}
            >
              <Icon
                name="reply"
                color="white"
                style={{ paddingHorizontal: 6 }}
              />
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Downloading indicator */}
      {donwloading && (
        <ActivityIndicator
          size={100}
          color="gray"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: "auto",
          }}
        />
      )}
    </View>
  );
};

export default Fullscreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
  },
  button: {
    position: "absolute",
    width: 50,
    height: 50,
    backgroundColor: "pink",
    borderRadius: 50,
    justifyContent: "center",
    right: 15,
    top: 45,
  },
  artistInfo: {
    flex: 1,
    flexDirection: "row",
    paddingTop: 20,
    paddingLeft: 10,
    justifyContent: "flex-start",
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 80,
    alignSelf: "center",
  },
  artist: {
    justifyContent: "center",
    paddingLeft: 10,
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
  extra: {
    position: "absolute",
    width: "100%",
    height: 120,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 1,
  },
  bottomSheet: {
    flex: 1,
    marginHorizontal: 20,
  },
  imgDesc: {
    fontWeight: "bold",
    fontSize: 20,
  },
  commentTitle: {
    fontWeight: "bold",
    fontSize: 20,
    paddingTop: 10,
  },
  bottomRightBtns: {
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 6,
  },
  lineBreak: {
    borderBottomColor: "grey",
    borderBottomWidth: 2,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#28282B",
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  comment: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "grey",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
});
