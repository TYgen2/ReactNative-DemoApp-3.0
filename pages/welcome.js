import { StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "../context/themeProvider";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { sleep } from "../utils/tools";
import { useSelector } from "react-redux";

const Welcome = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { newUser } = route.params;

  const { info } = useSelector((state) => state.user);

  // title animation config
  const titleY = useSharedValue(50);
  const titleO = useSharedValue(0);
  const reanimatedTitle = useAnimatedStyle(() => {
    return {
      opacity: titleO.value,
      transform: [{ translateY: titleY.value }],
    };
  }, []);

  // icon animation config
  const iconS = useSharedValue(0);
  const iconO = useSharedValue(0);
  const reanimatedIcon = useAnimatedStyle(() => {
    return {
      opacity: iconO.value,
      transform: [{ scale: iconS.value }],
    };
  }, []);

  // wave animation config
  const waveS = useSharedValue(1);
  const waveO = useSharedValue(0);
  const reanimatedWave = useAnimatedStyle(() => {
    return {
      opacity: waveO.value,
      transform: [{ scale: waveS.value }],
    };
  }, []);

  const welcomeAnimation = () => {
    titleO.value = withTiming(1, { duration: 1500 });
    titleY.value = withSequence(
      withTiming(0, { duration: 1000 }, (isFinished) => {
        if (isFinished) {
          iconO.value = withTiming(1, { duration: 1000 });
          iconS.value = withSequence(
            withTiming(1, { duration: 1000 }, (isFinished) => {
              if (isFinished) {
                waveO.value = withTiming(0.3, { duration: 1000 });
                waveS.value = withTiming(6, { duration: 1500 });
              }
            }),
            withTiming(1.1, { duration: 500 }),
            withTiming(1, { duration: 500 })
          );
        }
      }),
      withTiming(-150, { duration: 1000 })
    );
  };

  const goMain = async () => {
    await sleep(4000);
    navigation.reset({
      index: 0,
      routes: [{ name: "Inside" }],
    });
  };

  useEffect(() => {
    welcomeAnimation();
    goMain();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {info && (
        <Animated.Text
          style={[styles.title, reanimatedTitle, { color: colors.title }]}
        >
          {newUser ? "Welcome to ARTpreciate" : "Welcome back"}
          {"\n"}
          {info["name"]}!!
        </Animated.Text>
      )}
      {info && (
        <Animated.Image
          source={{ uri: info["icon"] }}
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
