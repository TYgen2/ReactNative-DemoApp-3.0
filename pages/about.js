import { StyleSheet, Text, View, ImageBackground } from "react-native";
import React from "react";

const About = () => (
  <View style={styles.container}>
    <ImageBackground
      source={require("../assets/chiori_sleep.webp")}
      resizeMode="cover"
      style={styles.image}
      imageStyle={{ opacity: 0.4 }}
    >
      <View style={styles.pagePadding}>
        <Text style={styles.title}>ARTppreciate v3.0</Text>
        <View
          style={{
            borderBottomColor: "#28282B",
            borderBottomWidth: 1,
            marginHorizontal: 10,
          }}
        />
        <Text style={styles.text}>
          This is the same demo app as 2.0{"\n"} But I'm moving all the CRUD
          functions to cloud{"\n"} This is still under development
        </Text>
      </View>
    </ImageBackground>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: "black",
    fontSize: 30,
    lineHeight: 84,
    fontWeight: "bold",
    textAlign: "center",
  },
  text: {
    paddingTop: 28,
    color: "black",
    fontSize: 18,
    textAlign: "center",
  },
  pagePadding: {
    position: "absolute",
    alignSelf: "center",
    top: 150,
  },
});

export default About;
