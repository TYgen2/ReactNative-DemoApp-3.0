import { ToastAndroid, Platform, AlertIOS, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import Toast from "react-native-toast-message";

export const FormatName = (str) => {
  if (str) {
    capitalized = str.charAt(0).toUpperCase() + str.slice(1);
    return capitalized.split("_")[0];
  }
};

export const FormatArtist = (str) => {
  if (str) {
    artist_name = str.split("_")[1];
    capitalized = artist_name.charAt(0).toUpperCase() + artist_name.slice(1);

    return capitalized.split(".")[0];
  }
};

export const Capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const Uncapitalize = (str) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

export const NotifyMessage = (msg) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    AlertIOS.alert(msg);
  }
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const GetHeaderHeight = () => {
  return useHeaderHeight();
};

export const saveImg = async (url, name) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status === "granted") {
      const fileUri = FileSystem.documentDirectory + `${name}` + ".jpg";
      const res = await FileSystem.downloadAsync(url, fileUri);

      await MediaLibrary.saveToLibraryAsync(res.uri);
      Toast.show({
        type: "success",
        text1: "Art saved ✅",
        text1Style: { fontSize: 20, textAlign: "center" },
        position: "top",
        visibilityTime: 2000,
      });
    } else {
      console.log("gg ed");
    }
  } catch (e) {
    console.log(e);
  }
};
