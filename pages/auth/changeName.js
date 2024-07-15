import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { EditName } from "../../services/fav";
import { Capitalize } from "../../utils/tools";

const ChangeName = ({ route, navigation }) => {
  const [name, setName] = useState("");
  const [isNameInputFocused, setNameInputFocused] = useState(false);
  const { provider, user } = route.params;
  const providerName =
    provider == "password"
      ? "Email & Password"
      : Capitalize(provider.substring(0, provider.length - 4));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.loginMethod}>
        <LinearGradient
          colors={
            providerName == "Email & Password"
              ? ["#e54335", "#f6b705"]
              : providerName == "Facebook"
              ? ["#1977f2", "#F0FFFF"]
              : ["#e54335", "#f6b705", "#35a354", "#4281ef"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.innerContainer}>
            <Text style={styles.remind}>
              You are currently using{"\n"}
              {providerName} to register
            </Text>
          </View>
        </LinearGradient>
        <Image
          source={
            providerName == "Email & Password"
              ? require("../../assets/email.png")
              : providerName == "Facebook"
              ? require("../../assets/facebook_name.png")
              : require("../../assets/google_name.png")
          }
          style={[
            styles.icon,
            {
              width:
                providerName == "Email & Password"
                  ? 150
                  : providerName == "Facebook"
                  ? 160
                  : 250,
              height:
                providerName == "Email & Password"
                  ? 150
                  : providerName == "Facebook"
                  ? 160
                  : 250,
            },
          ]}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          value={name}
          placeholder="Name"
          style={[
            styles.input,
            {
              borderColor:
                isNameInputFocused == true ? "#967969" : "transparent",
              borderWidth: isNameInputFocused == true ? 2 : 0,
              fontWeight: name === "" ? "bold" : "normal",
            },
          ]}
          onChangeText={(text) => setName(text)}
          onFocus={() => setNameInputFocused(true)}
          onSubmitEditing={() => setNameInputFocused(false)}
          onEndEditing={() => setNameInputFocused(false)}
        />
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => {
            EditName(user, name);
            navigation.reset({
              index: 0,
              routes: [{ name: "Welcome", params: { newUser: true } }],
            });
          }}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ChangeName;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  loginMethod: {
    marginTop: 100,
    width: "100%",
    flex: 1,
  },
  innerContainer: {
    borderRadius: 20,
    flex: 1,
    margin: 5,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  gradient: {
    borderRadius: 20,
    marginHorizontal: 30,
    flex: 0.5,
  },
  remind: {
    fontSize: 30,
    fontFamily: "Caveat-VariableFont_wght",
    textAlign: "center",
    textAlignVertical: "center",
  },
  icon: {
    flex: 1,
    resizeMode: "contain",
    alignSelf: "center",
  },
  inputContainer: {
    width: "100%",
    flex: 1,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    margin: 6,
    marginHorizontal: 40,
  },
  buttonContainer: {
    width: 90,
    marginTop: 25,
    borderRadius: 50,
    padding: 10,
    backgroundColor: "#C4A484",
    alignSelf: "center",
  },
  buttonText: {
    fontWeight: "bold",
    textAlign: "center",
    paddingBottom: 2,
  },
});
