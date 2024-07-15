import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/themeProvider";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
} from "firebase/storage";
import {
  GetHeaderHeight,
  NotifyMessage,
  Uncapitalize,
  sleep,
} from "../utils/tools";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "@rneui/themed";
import LottieView from "lottie-react-native";
import { db } from "../firebaseConfig";
import { UpdateContext } from "../context/updateArt";
import { useIsFocused } from "@react-navigation/native";
import { UploadArtToFB } from "../services/fav";
import { doc, getDoc } from "firebase/firestore";
import { uploadMetadata } from "../services/cloudFunctions";

const storage = getStorage();

const Upload = ({ route }) => {
  const { userId, guest } = route.params;

  const isFocused = useIsFocused();

  const docRef = doc(db, "user", userId);

  const getInfo = async () => {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setArtist(docSnap.data()["Info"]["name"]);
    } else {
      console.log("No such document!");
    }
  };

  useEffect(() => {
    if (!guest) {
      getInfo();
    }
    if (!isFocused) {
      reset();
    }
  }, [isFocused]);

  const windowWidth = Dimensions.get("window").width;

  const { colors } = useTheme();
  const padTop = GetHeaderHeight();

  const { setArtList } = useContext(UpdateContext);
  const { fetchTrigger, setFetchTrigger } = useContext(UpdateContext);

  const updateArtList = (name) => {
    const artRefs = ref(storage, `arts/${name}`);

    getDownloadURL(artRefs).then((url) => {
      getMetadata(artRefs).then((metadata) => {
        const newArtItem = {
          name: artRefs.name,
          art: url,
          uploadDate: new Date(metadata["timeCreated"]),
          artistId: userId,
          likes: 0,
        };

        setArtList((prev) => {
          const updatedList = [newArtItem, ...prev];
          return updatedList.sort(
            (a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()
          );
        });
      });
    });
  };

  const title = [
    "Step 1: Select the aspect ratio of your art",
    "Step 2: Select and crop your art",
    "Step 3: Provide your art name",
  ];

  const [step, setStep] = useState(title[0]);
  const [image, setImage] = useState(null);
  const [cropped, setCropped] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [selectedAR, setSelectedAR] = useState("3:4");
  const [arDone, setArDone] = useState(false);

  const [artName, setArtName] = useState("");
  const [artist, setArtist] = useState("");

  const [isArtNameInputFocused, setArtNameInputFocused] = useState(false);

  const ASPECT_RATIO = {
    "3:4": [192, 256],
    "4:3": [256, 192],
    "9:16": [144, 256],
    "16:9": [256, 144],
  };

  const previewW = useSharedValue(192);
  const previewH = useSharedValue(256);
  const previewY = useSharedValue(0);
  const previewS = useSharedValue(1);
  const previewO = useSharedValue(1);

  const textInputO = useSharedValue(0);
  const textInputY = useSharedValue(100);

  const uploadedO = useSharedValue(0);
  const uploadedY = useSharedValue(100);

  const reanimatedStyle = useAnimatedStyle(() => {
    return {
      width: previewW.value,
      height: previewH.value,
      transform: [{ scale: previewS.value }, { translateY: previewY.value }],
    };
  }, []);

  const reanimatedOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: previewO.value,
    };
  }, []);

  const reanimatedTextInput = useAnimatedStyle(() => {
    return {
      opacity: textInputO.value,
      transform: [{ translateY: textInputY.value }],
    };
  }, []);

  const reanimatedUploaded = useAnimatedStyle(() => {
    return {
      opacity: uploadedO.value,
      transform: [{ translateY: uploadedY.value }],
    };
  }, []);

  const uploadedOpacity = () => {
    uploadedO.value = withTiming(1, { duration: 1000 });
    uploadedY.value = withTiming(0, { duration: 1000 });
  };

  const textInputOpacity = () => {
    textInputO.value = withTiming(1, { duration: 1000 });
    textInputY.value = withTiming(0, { duration: 1000 });
  };

  const handlePreview = (width, height) => {
    previewW.value = withSpring(width);
    previewH.value = withSpring(height);
  };

  const step2Preview = () => {
    previewS.value = withTiming(
      selectedAR == "3:4" || selectedAR == "9:16" ? 1.7 : 1.4,
      {
        duration: 1000,
      }
    );
    previewY.value = withTiming(-80, { duration: 1000 });
  };

  const step3Preview = () => {
    previewY.value = withTiming(
      selectedAR == "3:4" || selectedAR == "9:16" ? -140 : -150,
      { duration: 1000 }
    );
    previewS.value = withTiming(
      selectedAR == "3:4" || selectedAR == "9:16" ? 1.4 : 1.4,
      { duration: 1000 }
    );
  };

  const debug2Preview = () => {
    previewY.value = withTiming(-80);
    previewS.value = withTiming(
      selectedAR == "3:4" || selectedAR == "9:16" ? 1.7 : 1.4
    );
    textInputO.value = withTiming(0);
    textInputY.value = withTiming(100);

    setStep(title[1]);
    setCropped(false);
  };

  const opacityPreview = () => {
    previewO.value = withTiming(0, { duration: 500 });
  };

  const debugPreview = () => {
    previewS.value = withSpring(1);
    previewY.value = withSpring(0);
    previewO.value = withSpring(1);
    setStep(title[0]);
    setArDone(false);
  };

  const pickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      aspect: ASPECT_RATIO[selectedAR],
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
    }
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

  // upload images
  const uploadArt = async (name, artist) => {
    setUploading(true);

    try {
      const { uri } = await FileSystem.getInfoAsync(image);
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          resolve(xhr.response);
        };
        xhr.onerror = (e) => {
          reject(new TypeError("Network request failed."));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      const filename = Uncapitalize(name) + "_" + Uncapitalize(artist) + ".jpg";
      const artRefs = ref(storage, "arts/" + filename);

      checkArtExists(artRefs).then(async (res) => {
        // file with same name does not exist yet, proceed to upload
        if (!res) {
          await uploadBytes(artRefs, blob).then(() => {
            console.log("uploaded successfully!");
            getDownloadURL(artRefs).then((url) => {
              // add to UploadedArts
              const metadata = {
                artFilename: filename,
                artName: Uncapitalize(name),
                artist: Uncapitalize(artist),
                artistId: userId,
                imgUrl: url,
              };
              // after upload the art metadata to Firestore illustrations,
              // return the docID and store it with imgUrl to Firestore user
              uploadMetadata(metadata).then((res) =>
                UploadArtToFB(userId, {
                  imgUrl: url,
                  artworkId: res.data,
                }).then(() => setFetchTrigger(!fetchTrigger))
              );
            });
            setUploading(false);
            setUploaded(true);
            sleep(3000);
          });
        } else {
          // file with same name already exist, prompt user for another name
          NotifyMessage("The name has already been used!");
          setUploading(false);
        }
      });
    } catch (e) {
      console.log(e);
    }
  };

  // reset page when user left the upload page
  const reset = () => {
    setCropped(false);
    setArtName("");
    debugPreview();
    setImage(null);
    setUploaded(false);
    textInputO.value = withTiming(0);
    textInputY.value = withTiming(100);
    uploadedO.value = withTiming(0);
    uploadedY.value = withTiming(100);
  };

  if (uploading || uploaded) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, marginTop: padTop },
        ]}
      >
        {uploading ? (
          <ActivityIndicator size="large" color="#483C32" />
        ) : (
          <View
            style={{
              height: 200,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LottieView
              style={{ flex: 1, aspectRatio: 1 }}
              source={require("../assets/uploaded.json")}
              autoPlay
              loop={false}
              speed={1}
              onAnimationLoaded={uploadedOpacity}
              onAnimationFinish={async () => {
                await sleep(1000);
                reset();
              }}
            />
            <Animated.Text
              style={[
                styles.uploaded,
                reanimatedUploaded,
                { color: colors.title },
              ]}
            >
              Successfully uploaded!
            </Animated.Text>
          </View>
        )}
      </View>
    );
  } else {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, marginTop: padTop },
        ]}
      >
        {guest ? (
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.subTitle, { color: colors.title }]}>
              Opps!
            </Text>
            <Text style={{ color: colors.subtitle }}>
              Sign in to use the Upload function.
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <View style={styles.title}>
              <Text
                style={{
                  color: colors.title,
                  fontWeight: "bold",
                  fontSize: 20,
                }}
              >
                {step}
              </Text>
            </View>
            <Animated.View style={[styles.buttonArea, reanimatedOpacityStyle]}>
              <FlatList
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "center",
                }}
                data={Object.keys(ASPECT_RATIO)}
                overScrollMode="never"
                horizontal={false}
                numColumns={2}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={[styles.arOptions, { borderColor: colors.icon }]}
                      onPress={() => {
                        handlePreview(
                          ASPECT_RATIO[item][0],
                          ASPECT_RATIO[item][1]
                        );
                        setSelectedAR(item);
                      }}
                      disabled={arDone ? true : false}
                    >
                      <Text style={[styles.arText, { color: colors.title }]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </Animated.View>
            {/* PREVIEW IMAGE */}
            <View style={styles.previewArea}>
              <Animated.Text
                style={[styles.previewText, reanimatedOpacityStyle]}
              >
                Preview
              </Animated.Text>
              {/* preview image */}
              <Animated.View
                style={[
                  styles.preview,
                  {
                    height: previewH,
                    width: previewW,
                    backgroundColor: colors.uploadPreview,
                  },
                  reanimatedStyle,
                ]}
              >
                <TouchableOpacity
                  disabled={arDone ? false : true}
                  onPress={pickImage}
                >
                  {image !== null ? (
                    <Image
                      source={{ uri: image }}
                      style={{
                        flex: 1,
                        width: ASPECT_RATIO[selectedAR][0],
                        borderRadius: 10,
                      }}
                    />
                  ) : (
                    <Animated.Text
                      style={[
                        {
                          fontSize: 20,
                          fontWeight: "bold",
                          color: arDone ? "grey" : "black",
                        },
                      ]}
                    >
                      {arDone ? "Tab to select" : selectedAR}
                    </Animated.Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{ alignItems: "center" }}>
                {cropped ? (
                  <Animated.View
                    style={[
                      {
                        position: "absolute",
                        bottom: 140,
                        width: windowWidth + 40,
                      },
                      reanimatedTextInput,
                    ]}
                  >
                    <TextInput
                      value={artName}
                      placeholder="name of art"
                      maxLength={24}
                      autoCapitalize="none"
                      style={[
                        styles.input,
                        {
                          borderColor:
                            isArtNameInputFocused == true ? "#967969" : "grey",
                          borderWidth: isArtNameInputFocused == true ? 2 : 2,
                          fontWeight: artName === "" ? "bold" : "normal",
                        },
                      ]}
                      onChangeText={(text) => setArtName(text.toLowerCase())}
                      onFocus={() => setArtNameInputFocused(true)}
                      onSubmitEditing={() => setArtNameInputFocused(false)}
                      onEndEditing={() => setArtNameInputFocused(false)}
                    />
                    {/* publish button */}
                    <TouchableOpacity
                      style={[
                        styles.publish,
                        { opacity: artName === "" ? 0 : 1 },
                      ]}
                      onPress={() => {
                        uploadArt(artName, artist);
                      }}
                      disabled={artName === "" ? true : false}
                    >
                      <Icon
                        name="publish"
                        type="materialicons"
                        style={{ paddingHorizontal: 4 }}
                      />
                      <Text style={{ alignSelf: "center", fontWeight: "bold" }}>
                        Publish
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.confirm,
                      {
                        opacity: image == null ? 0 : 1,
                        position: "absolute",
                        bottom: 80,
                      },
                    ]}
                    onPress={() => {
                      setCropped(true);
                      setStep(title[2]);
                      step3Preview();
                      textInputOpacity();
                    }}
                  >
                    <Icon
                      name="check-circle"
                      type="octicons"
                      style={{ paddingHorizontal: 4 }}
                    />
                    <Text style={{ alignSelf: "center", fontWeight: "bold" }}>
                      confirm
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
            {/* NEXT STEP BUTTON */}
            <TouchableOpacity
              style={[
                styles.step,
                { right: 0, bottom: 0, opacity: arDone ? 0 : 1 },
              ]}
              disabled={arDone ? true : false}
              onPress={() => {
                setStep(title[1]);
                setArDone(true);
                step2Preview();
                opacityPreview();
              }}
            >
              <Icon
                name="navigate-next"
                type="materialicons"
                color="black"
                size={40}
              />
            </TouchableOpacity>
            {/* STEP BACK BUTTON */}
            <TouchableOpacity
              style={[
                styles.step,
                { left: 0, bottom: 0, opacity: arDone ? 1 : 0 },
              ]}
              disabled={arDone ? false : true}
              onPress={() => {
                if (cropped) {
                  debug2Preview();
                  setArtName("");
                } else {
                  debugPreview();
                  setImage(null);
                }
              }}
            >
              <Icon
                name="navigate-before"
                type="materialicons"
                color="black"
                size={40}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    justifyContent: "center",
  },
  buttonArea: {
    flex: 2,
  },
  previewArea: {
    flex: 5,
    justifyContent: "center",
  },
  arOptions: {
    padding: 20,
    margin: 10,
    borderRadius: 10,
    width: 160,
    borderWidth: 1,
  },
  arText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  preview: {
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 100,
  },
  previewText: {
    alignSelf: "center",
    fontSize: 20,
    color: "white",
    padding: 10,
    fontWeight: "bold",
  },
  step: {
    flex: 1,
    backgroundColor: "#EADDCA",
    justifyContent: "center",
    position: "absolute",
    margin: 20,
    borderRadius: 40,
    padding: 4,
  },
  confirm: {
    flexDirection: "row",
    backgroundColor: "#9FE2BF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    margin: 6,
    marginHorizontal: 40,
  },
  publish: {
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#D8BFD8",
    borderRadius: 30,
    padding: 15,
    position: "absolute",
    bottom: -100,
  },
  uploaded: {
    fontWeight: "bold",
    fontSize: 24,
    bottom: 20,
  },
  subTitle: {
    fontWeight: "bold",
    fontSize: 30,
    paddingBottom: 10,
  },
});

export default Upload;
