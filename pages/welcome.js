import { StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "../context/themeProvider";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { sleep } from "../utils/tools";
import { auth, db } from "../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

const Welcome = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { newUser, isGuest } = route.params;
  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");

  // title animation config
  const titleY = useSharedValue(50);
  const titleO = useSharedValue(0);
  const reanimatedTitle = useAnimatedStyle(() => {
    return {
      opacity: titleO.value,
      transform: [{ translateY: titleY.value }],
    };
  }, []);
  const titleOpacity = async () => {
    titleO.value = withTiming(1, { duration: 1500 });
    titleY.value = withTiming(0, { duration: 1000 });
    await sleep(1000);
    titleY.value = withTiming(-150, { duration: 1000 });
  };

  // icon animation config
  const iconS = useSharedValue(0);
  const iconO = useSharedValue(0);
  const reanimatedIcon = useAnimatedStyle(() => {
    return {
      opacity: iconO.value,
      transform: [{ scale: iconS.value }],
    };
  }, []);
  const iconOpacity = async () => {
    await sleep(1000);
    iconO.value = withTiming(1, { duration: 1000 });
    iconS.value = withTiming(1, { duration: 1000 });
    await sleep(1000);
    iconS.value = withTiming(1.1, { duration: 500 });
    await sleep(500);
    iconS.value = withTiming(1, { duration: 500 });
  };

  // wave animation config
  const waveS = useSharedValue(1);
  const waveO = useSharedValue(0);
  const reanimatedWave = useAnimatedStyle(() => {
    return {
      opacity: waveO.value,
      transform: [{ scale: waveS.value }],
    };
  }, []);
  const waveOpacity = async () => {
    await sleep(1800);
    waveO.value = withTiming(0.3, { duration: 1000 });
    waveS.value = withTiming(5, { duration: 1500 });
  };

  const goMain = async () => {
    await sleep(4000);
    navigation.reset({
      index: 0,
      routes: [{ name: "Inside", params: { isGuest: isGuest } }],
    });
  };

  const userId = auth.currentUser.uid;
  const docRef = doc(db, "user", userId);

  useEffect(() => {
    titleOpacity();
    iconOpacity();
    waveOpacity();
    goMain();

    const unsubscribe = onSnapshot(docRef, (doc) => {
      setIcon(doc.data()["Info"]["icon"]);
      setName(doc.data()["Info"]["name"]);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {name && (
        <Animated.Text
          style={[styles.title, reanimatedTitle, { color: colors.title }]}
        >
          {newUser ? "Welcome to ARTpreciate" : "Welcome back"}
          {"\n"}
          {name}!!
        </Animated.Text>
      )}
      {icon && (
        <Animated.Image
          source={{ uri: icon }}
          style={[styles.icon, reanimatedIcon]}
        />
      )}
      <Animated.View style={[styles.wave, reanimatedWave]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    textAlign: "center",
    fontWeight: "bold",
  },
  icon: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 150,
    alignSelf: "center",
  },
  wave: {
    position: "absolute",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "grey",
    width: 185,
    height: 185,
    borderRadius: 185,
  },
});

export default Welcome;
