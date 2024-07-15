import { Image, StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Icon } from "@rneui/themed";
import { TouchableOpacity } from "react-native-gesture-handler";
import { handleSignOut } from "../services/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import Toggle from "react-native-toggle-element";
import { useTheme } from "../context/themeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CustomDrawer = (props) => {
  const { dark, colors, setScheme } = useTheme();

  const ToggleTheme = () => {
    dark ? setScheme("light") : setScheme("dark");
  };

  const navigation = useNavigation();

  // for switch toggle
  const [toggleValue, setToggleValue] = useState(false);

  // init theme when user reopen the app
  const initTheme = async () => {
    try {
      const theme = await AsyncStorage.getItem("theme");
      setToggleValue(JSON.parse(theme));

      if (theme == "true") {
        setScheme("dark");
      } else {
        setScheme("light");
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    initTheme();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigation.replace("Intro");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.header}>
      <View style={{ flex: 0.3 }}>
        <Image
          source={require("../assets/chiori.jpg")}
          style={styles.headerImage}
        />
      </View>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ backgroundColor: colors.drawer, flex: 1 }} // drawer background color
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={[styles.theme, { backgroundColor: colors.drawer }]}>
        <Icon type="material" name="lightbulb" color="white" />
        <Text style={styles.itemText}>Theme</Text>
        <Toggle
          value={toggleValue}
          onPress={async (value) => {
            setToggleValue(value);
            ToggleTheme();
            try {
              await AsyncStorage.setItem("theme", JSON.stringify(value));
            } catch (e) {
              console.log(e);
            }
          }}
          containerStyle={{ paddingLeft: 80 }}
          trackBar={{
            width: 50,
            height: 30,
            borderWidth: 2,
            activeBackgroundColor: "black",
            inActiveBackgroundColor: "white",
          }}
          thumbButton={{
            width: 28,
            height: 28,
            activeBackgroundColor: "white",
            inActiveBackgroundColor: "black",
          }}
          thumbActiveComponent={
            <Icon type="material" name="dark-mode" color="black" size={20} />
          }
          thumbInActiveComponent={
            <Icon type="material" name="wb-sunny" color="white" size={20} />
          }
        />
      </View>
      <TouchableOpacity
        style={[styles.logout, { backgroundColor: colors.drawer }]}
        activeOpacity={0.9}
        onPress={() => handleSignOut()}
      >
        <Icon type="material" name="logout" color="white" />
        <Text style={styles.itemText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  header: {
    flex: 1,
  },
  headerImage: {
    width: "100%",
    height: undefined,
    paddingTop: 400,
    opacity: 0.9,
  },
  theme: {
    flexDirection: "row",
    paddingTop: 20,
    paddingLeft: 18,
    paddingBottom: 20,
  },
  logout: {
    flexDirection: "row",
    paddingTop: 20,
    paddingLeft: 18,
    paddingBottom: 20,
  },
  itemText: {
    color: "white",
    fontSize: 18,
    paddingLeft: 30,
  },
});
