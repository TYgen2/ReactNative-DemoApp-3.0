import { createDrawerNavigator } from "@react-navigation/drawer";
import { Icon } from "@rneui/themed";
import HomeScreen from "../pages/home";
import About from "../pages/about";
import CustomDrawer from "../components/customDrawer";
import Random from "../pages/random";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  View,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/themeProvider";
import Search from "../pages/search";
import Upload from "../pages/upload";
import { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const NavDrawer = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { isGuest } = route.params;
  const Drawer = createDrawerNavigator();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [sign, setSign] = useState("");
  const [isLoading, setIsLoading] = useState(!isGuest);

  const userId = auth.currentUser.uid;
  const docRef = doc(db, "user", userId);

  if (!isGuest) {
    const getName = async () => {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setName(docSnap.data()["Info"]["name"]);
        setIcon(docSnap.data()["Info"]["icon"]);
        setSign(docSnap.data()["Info"]["sign"]);
      } else {
        console.log("No such document!");
      }

      setIsLoading(false);
    };

    useEffect(() => {
      getName();

      const unsubscribe = onSnapshot(docRef, (doc) => {
        setIcon(doc.data()["Info"]["icon"]);
        setSign(doc.data()["Info"]["sign"]);
        setName(doc.data()["Info"]["name"]);
      });
      return () => unsubscribe();
    }, []);
  }

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        drawerActiveTintColor: "white",
        drawerInactiveTintColor: "white",
        drawerActiveBackgroundColor: "#483C32", // brown when selected
        drawerLabelStyle: {
          fontSize: 18,
          fontWeight: "normal",
        },
        drawerStyle: {
          overflow: "hidden",
          borderTopRightRadius: 30,
          borderBottomRightRadius: 30,
          backgroundColor: "#fff",
        },
        headerTransparent: true,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ user: userId, guest: isGuest }}
        options={{
          headerBackgroundContainerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.icon,
          headerTitleStyle: { color: "transparent" },
          drawerIcon: () => <Icon type="material" name="home" color="white" />,
          headerRight: () => (
            <TouchableOpacity
              style={[styles.profile, { opacity: isGuest ? 0 : 1 }]}
              onPress={() => {
                navigation.push("Profile", {
                  user: userId,
                  guest: isGuest,
                  artistId: userId,
                  name: name,
                  sign: sign,
                  icon: icon ? icon : "https://",
                });
              }}
              disabled={isGuest ? true : false}
            >
              {isLoading ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="small" color="#483C32" />
                </View>
              ) : (
                <Image
                  source={{
                    uri: icon ? icon : "https://",
                  }}
                  style={{ flex: 1, width: 70, borderRadius: 40 }}
                />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <Drawer.Screen
        name="About"
        component={About}
        options={{
          headerTitleStyle: { color: "transparent" },
          drawerIcon: () => <Icon type="material" name="info" color="white" />,
        }}
      />
      <Drawer.Screen
        name="Search"
        component={Search}
        initialParams={{ guest: isGuest }}
        options={{
          headerTintColor: colors.icon,
          headerTitleStyle: { color: colors.title },
          drawerIcon: () => (
            <Icon type="material" name="search" color="white" />
          ),
        }}
      />
      <Drawer.Screen
        name="Random"
        component={Random}
        initialParams={{ guest: isGuest, user: userId }}
        options={{
          headerTitleAlign: "center",
          headerBackgroundContainerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.icon,
          headerTitle: () => (
            <Text style={[styles.title, { color: colors.title }]}>
              Random art 🎲
            </Text>
          ),
          drawerIcon: () => (
            <Icon type="font-awesome" name="random" color="white" />
          ),
        }}
      />
      <Drawer.Screen
        name="Upload"
        component={Upload}
        initialParams={{ userId: userId, guest: isGuest }}
        options={{
          headerTitleAlign: "center",
          headerBackgroundContainerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.icon,
          headerTitle: () => (
            <Text style={[styles.title, { color: colors.title }]}>
              Upload 💭
            </Text>
          ),
          drawerIcon: () => (
            <Icon type="material" name="upload" color="white" />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default NavDrawer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    fontSize: 22,
  },
  profile: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 10,
    top: 20,
    width: 70,
    height: 70,
    borderRadius: 40,
  },
});
