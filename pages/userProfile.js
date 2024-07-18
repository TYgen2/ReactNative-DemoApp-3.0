import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import UploadItem from "../components/uploadItem";
import { useTheme } from "../context/themeProvider";
import { Icon } from "@rneui/themed";
import Dialog from "react-native-dialog";
import DialogInput from "react-native-dialog/lib/Input";
import { EditIcon, EditSign } from "../services/fav";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { sleep } from "../utils/tools";
import { fetchUploaded } from "../services/cloudFunctions";
import { UpdateContext } from "../context/updateArt";

const storage = getStorage();

const UserProfile = ({ route }) => {
  const { colors } = useTheme();

  const { artistId, name, sign, icon, user, guest } = route.params;
  const [uploadList, setUploadlist] = useState([]);
  const [newSign, setNewSign] = useState(sign);
  const [tempSign, setTempSign] = useState(sign);
  const [showIcon, setShowIcon] = useState(icon);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchUploadedLoading, setFetchUploadedLoading] = useState(true);

  const { fetchTrigger, setFetchTrigger } = useContext(UpdateContext);

  useEffect(() => {
    setFetchUploadedLoading(true);
    fetchUploaded({ userId: artistId }).then((res) => {
      setUploadlist(res.data);
      setFetchUploadedLoading(false);
    });
  }, [fetchTrigger]);

  const [visible, setVisible] = useState(false);

  const showDialog = () => {
    setVisible(true);
  };

  const handleCancel = async () => {
    setVisible(false);
    await sleep(1000);
    setTempSign(newSign);
  };

  const handleConfirm = () => {
    EditSign(user, tempSign);
    setNewSign(tempSign);
    setVisible(false);
  };

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
        getDownloadURL(artRefs).then((url) => {
          EditIcon(user, url);
          setShowIcon(url);
        });
      });

      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <UploadItem
      imgUrl={item["imgUrl"]}
      artworkId={item["artworkId"]}
      guest={guest}
      user={user}
      artistId={artistId}
    />
  );

  return (
    <View style={styles.Container}>
      <View
        style={[
          styles.infoContainer,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.icon,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.profileIcon}
          onPress={changeIcon}
          disabled={user === artistId ? false : true}
        >
          {isLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#483C32" />
            </View>
          ) : (
            <Image
              source={{ uri: showIcon }}
              style={{ flex: 1, width: 180, borderRadius: 100 }}
            />
          )}
        </TouchableOpacity>
        <Text style={[styles.artist, { color: colors.title }]}>{name}</Text>
        <TouchableOpacity
          style={[styles.signContainer, { backgroundColor: colors.icon }]}
          onPress={showDialog}
          disabled={user === artistId ? false : true}
        >
          <Dialog.Container visible={visible} onBackdropPress={handleCancel}>
            <Dialog.Title>Edit your personal signature</Dialog.Title>
            <DialogInput
              value={newSign == tempSign ? newSign : tempSign}
              placeholder="write something..."
              onChangeText={(text) => setTempSign(text)}
              style={{ color: "black" }}
            />
            <Dialog.Button label="Cancel" onPress={async () => handleCancel} />
            <Dialog.Button label="Confirm" onPress={handleConfirm} />
          </Dialog.Container>
          <Icon
            name="signature"
            type="font-awesome-5"
            color={colors.invertedText}
            size={14}
          />
          <Text style={[styles.signature, { color: colors.invertedText }]}>
            {` : ${newSign}`}
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={[styles.artContainer, { backgroundColor: colors.background }]}
      >
        <FlatList
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingBottom: 50,
              }}
            >
              {fetchUploadedLoading ? (
                <Image
                  source={require("../assets/kurukuru.gif")}
                  style={{ width: 100, height: 100 }}
                />
              ) : (
                <Text style={[styles.empty, { color: colors.title }]}>
                  This user hasn't post any art
                </Text>
              )}
            </View>
          }
          columnWrapperStyle={{
            justifyContent: "flex-start",
          }}
          contentContainerStyle={{ flexGrow: 1 }}
          overScrollMode="never"
          horizontal={false}
          data={uploadList}
          numColumns={3}
          renderItem={renderItem}
        />
      </View>
    </View>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  Container: {
    flex: 1,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderColor: "grey",
  },
  artContainer: {
    flex: 1,
  },
  profileIcon: {
    width: 180,
    height: 180,
    borderRadius: 100,
  },
  artist: {
    fontSize: 20,
    fontWeight: "bold",
    paddingTop: 10,
  },
  signContainer: {
    flex: 0.3,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginTop: 30,
  },
  signature: {
    fontSize: 14,
    fontStyle: "italic",
  },
  empty: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
