import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { handleSignUp } from "../../services/auth";
import { NotifyMessage } from "../../utils/tools";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [isEmailInputFocused, setEmailInputFocused] = useState(false);
  const [isPasswordInputFocused, setPasswordInputFocused] = useState(false);
  const [isConfirmInputFocused, setConfirmInputFocused] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inputContainer}>
        {/* email input */}
        <TextInput
          value={email}
          placeholder="Email"
          style={[
            styles.input,
            {
              borderColor:
                isEmailInputFocused == true ? "#967969" : "transparent",
              borderWidth: isEmailInputFocused == true ? 2 : 0,
              fontWeight: email === "" ? "bold" : "normal",
            },
          ]}
          onChangeText={(text) => setEmail(text)}
          onFocus={() => setEmailInputFocused(true)}
          onSubmitEditing={() => setEmailInputFocused(false)}
          onEndEditing={() => setEmailInputFocused(false)}
        />

        {/* password input */}
        <TextInput
          value={password}
          placeholder="Password"
          style={[
            styles.input,
            {
              borderColor:
                isPasswordInputFocused == true ? "#967969" : "transparent",
              borderWidth: isPasswordInputFocused == true ? 2 : 0,
              fontWeight: password === "" ? "bold" : "normal",
            },
          ]}
          onChangeText={(text) => setPassword(text)}
          secureTextEntry
          onFocus={() => setPasswordInputFocused(true)}
          onSubmitEditing={() => setPasswordInputFocused(false)}
          onEndEditing={() => setPasswordInputFocused(false)}
        />
        <Text style={styles.reminder}>
          * Password length must be longer than 6 characters
        </Text>

        {/* confirm password input */}
        <TextInput
          value={confirm}
          placeholder="Confirm Password"
          style={[
            styles.input,
            {
              borderColor:
                isConfirmInputFocused == true ? "#967969" : "transparent",
              borderWidth: isConfirmInputFocused == true ? 2 : 0,
              fontWeight: confirm === "" ? "bold" : "normal",
            },
          ]}
          onChangeText={(text) => setConfirm(text)}
          secureTextEntry
          onFocus={() => setConfirmInputFocused(true)}
          onSubmitEditing={() => setConfirmInputFocused(false)}
          onEndEditing={() => setConfirmInputFocused(false)}
        />

        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => {
            if (password === confirm) {
              handleSignUp(email, password);
            } else {
              NotifyMessage("Passwords do not match!");
            }
          }}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  inputContainer: {
    width: "100%",
    marginTop: 100,
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
    marginTop: 12,
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
  reminder: {
    marginHorizontal: 40,
    color: "grey",
    fontSize: 12,
  },
});
