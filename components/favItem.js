import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { React, useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import { UpdateContext } from "../context/updateArt";

const windowWidth = Dimensions.get("window").width;

export default FavItem = ({ userId, imgUrl, artworkId }) => {
  const navigation = useNavigation();
  const { fetchTrigger, setFetchTrigger } = useContext(UpdateContext);

  return (
    <View style={styles.artList}>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate("Full art", {
            user: userId,
            artworkId: artworkId,
            fav: true,
            imgUrl: imgUrl,
            onGoBack: (updatedStatus, updatedLike) => {
              setFetchTrigger(!fetchTrigger);
            },
          });
        }}
      >
        <Image source={{ uri: imgUrl }} style={{ flex: 1 }} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  artList: {
    width: (windowWidth / 2) * 0.9,
    height: (windowWidth / 2) * 0.9,
  },
});
