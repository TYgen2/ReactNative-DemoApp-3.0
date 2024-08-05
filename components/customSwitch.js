import { StyleSheet, View, TouchableWithoutFeedback, Text } from "react-native";
import React, { useEffect, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const CustomSwitch = ({ onToggle }) => {
  const [mode, setMode] = useState(false);

  const switchTranslate = useSharedValue(0);

  const customSpringStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(switchTranslate.value, {
            mass: 1,
            damping: 15,
            stiffness: 120,
            overshootClamping: false,
            restSpeedThreshold: 0.001,
            restDisplacementThreshold: 0.001,
          }),
        },
      ],
    };
  });

  useEffect(() => {
    if (mode) {
      switchTranslate.value = 58;
    } else {
      switchTranslate.value = 2;
    }
  }, [mode, switchTranslate]);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setMode(!mode);
        onToggle(!mode);
      }}
    >
      <Animated.View style={styles.container}>
        <View style={styles.textContainer}>
          <Text
            style={[styles.optionText, { color: mode ? "white" : "black" }]}
          >
            Like
          </Text>
          <Text
            style={[styles.optionText, { color: mode ? "black" : "white" }]}
          >
            New
          </Text>
        </View>
        <Animated.View style={[styles.circle, customSpringStyles]} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default CustomSwitch;

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 30,
    borderRadius: 4,
    marginRight: 4,
    justifyContent: "center",
    backgroundColor: "#28282B",
    elevation: 1,
    zIndex: 1,
  },
  circle: {
    width: 60,
    height: 24,
    borderRadius: 4,
    backgroundColor: "white",
  },
  textContainer: {
    flex: 1,
    position: "absolute",
    width: 120,
    flexDirection: "row",
    justifyContent: "space-evenly",
    elevation: 2,
    zIndex: 2,
    shadowColor: "transparent",
  },
  optionText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
  },
});
