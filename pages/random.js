import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import ArtItem from "../components/artItem";
import { Icon } from "@rneui/themed";
import { useTheme } from "../context/themeProvider";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";
import { UpdateContext } from "../context/updateArt";

const Random = ({ route }) => {
  const { colors } = useTheme();
  const { guest, user } = route.params;

  const [ranLoading, setRanLoading] = useState(true);
  const [artList, setArtList] = useState([]);
  const { fetchTrigger, setFetchTrigger } = useContext(UpdateContext);

  const getRandomInteger = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // make use of the pagination fetch, to generate a random
  // art CLOUD FUNCTION, WORKING!!!
  const fetchRandomArt = async () => {
    const totalCallable = httpsCallable(functions, "totalArtCount");
    const fetchCallable = httpsCallable(functions, "paginationFetch");

    setRanLoading((prev) => true);
    totalCallable({}).then((res) => {
      const totalArts = res.data["data"];

      if (totalArts === 0) {
        return;
      }

      const randomPage = getRandomInteger(1, totalArts);

      fetchCallable({ page: randomPage, limit: 1 })
        .then(async (res) => {
          setArtList(res.data["data"]);
        })
        .then(() => {
          setRanLoading((prev) => false);
        });
    });
  };

  useEffect(() => {
    fetchRandomArt();
  }, [fetchTrigger]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.artContainer, { backgroundColor: colors.background }]}
      >
        {ranLoading ? (
          // initializing...
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingRight: 20,
            }}
          >
            <Image
              source={require("../assets/kurukuru.gif")}
              style={{ width: 150, height: 150 }}
            />
          </View>
        ) : (
          <ArtItem
            user={user}
            guest={guest}
            width={undefined}
            left={0}
            top={24}
            bottom={18}
            artworkId={artList[0]["artworkID"]}
            artFilename={artList[0]["artFilename"]}
            artName={artList[0]["artName"]}
            artist={artList[0]["artist"]}
            artistId={artList[0]["artistId"]}
            imgUrl={artList[0]["imgUrl"]}
          />
        )}
      </View>
      <TouchableOpacity
        style={[styles.refresh, , { backgroundColor: colors.background }]}
        onPress={() => {
          // randomly select an art from the artList
          fetchRandomArt();
        }}
      >
        <Icon type="font-awesome" name="refresh" color={colors.icon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  artContainer: {
    flex: 1,
    marginTop: 80,
    marginBottom: 80,
    paddingHorizontal: 40,
  },
  refresh: {
    position: "absolute",
    alignSelf: "center",
    bottom: 30,
  },
});

export default Random;
