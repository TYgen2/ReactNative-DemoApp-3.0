import { createStackNavigator } from "@react-navigation/stack";
import IntroPage from "../pages/auth/intro";
import SignIn from "../pages/auth/sign_in";
import Register from "../pages/auth/register";
import NavDrawer from "./drawer";
import Fullscreen from "../pages/fullscreen/fullscreen_art";
import UserProfile from "../pages/userProfile";
import { useTheme } from "../context/themeProvider";
import { ArtContextProvider } from "../context/updateArt";
import changeName from "../pages/auth/changeName";
import ChangeName from "../pages/auth/changeName";
import Welcome from "../pages/welcome";

const Stack = createStackNavigator();

const NavStack = () => {
  const { colors } = useTheme();

  return (
    <ArtContextProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="Intro"
          component={IntroPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Sign in"
          component={SignIn}
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="Sign up"
          component={Register}
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="Change name"
          component={ChangeName}
          options={{
            headerShown: true,
            headerTransparent: true,
            title: "What's your artist name 🖊 ?",
            headerLeft: false,
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="Welcome"
          component={Welcome}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Inside"
          component={NavDrawer}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Full art"
          component={Fullscreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={UserProfile}
          options={({ route }) => ({
            title: `${route.params.name}'s profile`,
            headerTitleStyle: {
              color: colors.title,
            },
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.icon,
          })}
        />
      </Stack.Navigator>
    </ArtContextProvider>
  );
};

export default NavStack;
