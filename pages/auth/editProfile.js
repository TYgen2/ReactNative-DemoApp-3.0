import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Icon } from "@rneui/themed";
import { EditIcon, EditSign } from "../../services/fav";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { DEFAULT_ICON, DEFAULT_SIGN } from "../../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { getInfo } from "../../store/profileInfoAction";

const storage = getStorage();

const EditProfile = ({ route, navigation }) => {
  const { user, name } = route.params;

  const [sign, setSign] = useState(DEFAULT_SIGN);
  const [showIcon, setShowIcon] = useState(DEFAULT_ICON);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();

  const changeIcon = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      aspect: [1, 1],
    });

    if (!res.canceled) {
      setIsLoading(true);
      const { uri } = await FileSystem.getInfoAsync(res.assets[0].uri);

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

      const filename = user + ".jpg";
      const artRefs = ref(storage, "userIcon/" + filename);

      await uploadBytes(artRefs, blob).then((snapshot) => {
        getDownloadURL(artRefs)
          .then((url) => {
            EditIcon(user, url);
            setShowIcon(url);
          })
          .then(() => setIsLoading(false));
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* profile icon */}
      <TouchableOpacity style={styles.icon} onPress={changeIcon}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#483C32" />
        ) : (
          <Image
            source={{ uri: showIcon }}
            style={{ height: 200, width: 200, borderRadius: 100 }}
          />
        )}
      </TouchableOpacity>

      {/* profile name */}
      <Text style={styles.name}>{name}</Text>

      {/* profile sign */}
      <Text
        style={{
          fontSize: 16,
          marginBottom: 4,
          color: "grey",
          fontStyle: "italic",
        }}
      >
        About you 💭{" "}
      </Text>
      <View style={styles.sign}>
        <Icon name="edit" type="font-awesome-5" size={14} />
        <Text
          style={{
            paddingLeft: 10,
            fontSize: 24,
            fontFamily: "Caveat-VariableFont_wght",
          }}
        >
          {sign + " "}
        </Text>
      </View>

      {/* sign input */}
      <TextInput
        value={sign}
        placeholder="Personal signature"
        style={[
          styles.input,
          {
            borderColor: "#967969",
            borderWidth: 2,
            fontWeight: sign === "" ? "bold" : "normal",
          },
        ]}
        onChangeText={(text) => setSign(text)}
      />

      {/* DONE button */}
      <TouchableOpacity
        style={[
          styles.done,
          { opacity: sign == DEFAULT_SIGN && showIcon == DEFAULT_ICON ? 0 : 1 },
        ]}
        disabled={
          sign == DEFAULT_SIGN && showIcon == DEFAULT_ICON ? true : false
        }
        onPress={async () => {
          await EditSign(user, sign);
          await dispatch(getInfo(user)).unwrap();
          navigation.reset({
            index: 0,
            routes: [{ name: "Welcome", params: { newUser: true } }],
          });
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 20,
          }}
        >
          DONE
        </Text>
        <Icon name="done" />
      </TouchableOpacity>

      {/* RESET button */}
      <TouchableOpacity
        style={[
          styles.reset,
          { opacity: sign == DEFAULT_SIGN && showIcon == DEFAULT_ICON ? 0 : 1 },
        ]}
        disabled={
          sign == DEFAULT_SIGN && showIcon == DEFAULT_ICON ? true : false
        }
        onPress={async () => {
          setSign(DEFAULT_SIGN);
          setShowIcon(DEFAULT_ICON);
          await EditIcon(user, DEFAULT_ICON);
        }}
      >
        <Icon name="refresh" />
      </TouchableOpacity>

      <View
        style={{
          flex: 2,
          justifyContent: "center",
          alignItems: "center",
          opacity: sign == DEFAULT_SIGN && showIcon == DEFAULT_ICON ? 1 : 0,
        }}
      >
        <TouchableOpacity
          style={{ backgroundColor: "#CCCCFF", borderRadius: 10, padding: 8 }}
          onPress={async () => {
            await dispatch(getInfo(user)).unwrap();
            navigation.reset({
              index: 0,
              routes: [{ name: "Welcome", params: { newUser: true } }],
            });
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Keep it as default
          </Text>
        </TouchableOpacity>
        <Text style={{ color: "grey", paddingVertical: 4 }}>
          You can edit them later in your profile
        </Text>
      </View>
    </ScrollView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    flex: 1,
  },
  icon: {
    height: 200,
    width: 200,
    borderRadius: 100,
    marginTop: 100,
    justifyContent: "center",
  },
  name: {
    flex: 1,
    textAlignVertical: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  sign: {
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#F2D2BD",
    paddingHorizontal: 10,
    width: 360,
    borderRadius: 4,
    alignItems: "center",
  },
  input: {
    flex: 0.3,
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    margin: 6,
    marginTop: 10,
    width: 360,
    marginHorizontal: 40,
  },
  done: {
    backgroundColor: "#9FE2BF",
    justifyContent: "center",
    height: 100,
    width: 100,
    borderRadius: 50,
    marginTop: 50,
  },
  reset: {
    position: "absolute",
    width: 50,
    height: 50,
    backgroundColor: "#CCCCFF",
    top: 100,
    right: 15,
    justifyContent: "center",
    borderRadius: 40,
    elevation: 4,
  },
});
