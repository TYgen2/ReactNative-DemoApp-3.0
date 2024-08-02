import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  React,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FlatList } from "react-native-gesture-handler";
import ArtItem from "../../components/artItem";
import { useTheme } from "../../context/themeProvider";
import { GetHeaderHeight, sleep } from "../../utils/tools";
import { UpdateContext } from "../../context/updateArt";
import { functions } from "../../firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { Icon } from "@rneui/themed";

const Artwork = ({ route }) => {
  const { colors } = useTheme();
  const { user, guest } = route.params;
  const [isGuest, setGuest] = useState(guest);

  const [artList, setArtList] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const { fetchTrigger, setFetchTrigger } = useContext(UpdateContext);

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 3;

  const flatlistRef = useRef();
  const toTop = () => {
    flatlistRef.current.scrollToIndex({ animated: true, index: 0 });
  };

  // set the total pages to be shown using CLOUD FUNCTION, WORKING!!!
  const totalArtCount = async () => {
    const totalCallable = httpsCallable(functions, "totalArtCount");
    totalCallable({}).then((res) => {
      const totalPages = Math.ceil(res.data["data"] / PER_PAGE);
      setTotalPages(totalPages);
    });
  };

  // fetch required arts using CLOUD FUNCTION, WORKING!!!
  const fetchArts = async () => {
    const fetchCallable = httpsCallable(functions, "paginationFetch");
    fetchCallable({ page: currentPage, limit: PER_PAGE }).then(async (res) => {
      if (initialLoading) {
        setFetchTrigger(true);
        setInitialLoading(false);
      }

      // go to top for displaying the loading logo
      if (artList.length != 0) {
        toTop();
        setArtList([]);
        await sleep(200);
      }

      // set the fetch arts display for current page
      setArtList(res.data["data"]);
    });
  };

  const renderItem = useCallback(
    ({ item }) => (
      <ArtItem
        user={user}
        guest={isGuest}
        width={300}
        left={20}
        top={12}
        bottom={16}
        artworkId={item["artworkID"]}
        artName={item["artName"]}
        artist={item["artist"]}
        artistId={item["artistId"]}
        imgUrl={item["imgUrl"]}
      />
    ),
    []
  );

  const displayPage = (currentPage) => {
    let start;

    if (currentPage <= 3 || totalPages <= 5) {
      start = 1;
    } else if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
    } else {
      start = currentPage - 2;
    }

    return Array.from(
      { length: totalPages >= 5 ? 5 : totalPages },
      (_, index) => start + index
    );
  };

  useEffect(() => {
    totalArtCount().then(() => {
      fetchArts();
    });
  }, [currentPage, fetchTrigger]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, marginTop: GetHeaderHeight() },
      ]}
    >
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.title }]}>
          Recent Arts 🔥
        </Text>
      </View>
      <View style={styles.artContent}>
        <FlatList
          ListEmptyComponent={
            <View
              style={{
                flexGrow: 1,
                justifyContent: "center",
              }}
            >
              {fetchTrigger ? (
                <ActivityIndicator size="large" color="#483C32" />
              ) : (
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: 24,
                    color: colors.title,
                  }}
                >
                  No one post art yet... 🥱{"\n"}
                  Be the first one ✨!
                </Text>
              )}
            </View>
          }
          contentContainerStyle={{ paddingEnd: 20, flexGrow: 1 }}
          overScrollMode="never"
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          data={artList}
          renderItem={renderItem}
          removeClippedSubviews={true}
          windowSize={10}
          ref={flatlistRef}
        />
        <View style={styles.pages}>
          {/* first page button */}
          <TouchableOpacity
            style={[
              styles.arrowButton,
              {
                opacity:
                  totalPages === 0 || initialLoading
                    ? 0
                    : currentPage === 1
                    ? 0.3
                    : 1,
              },
            ]}
            disabled={currentPage === 1 ? true : false}
            onPress={() => {
              setFetchTrigger(true);
              setCurrentPage((prev) => 1);
            }}
          >
            <Icon name="first-page" color={colors.icon} />
          </TouchableOpacity>
          {/* previous page button */}
          <TouchableOpacity
            style={[
              styles.arrowButton,
              {
                opacity:
                  totalPages === 0 || initialLoading
                    ? 0
                    : currentPage === 1
                    ? 0.3
                    : 1,
              },
            ]}
            disabled={currentPage === 1 ? true : false}
            onPress={() => {
              setFetchTrigger(true);
              setCurrentPage((prev) => prev - 1);
            }}
          >
            <Icon type="entypo" name="chevron-left" color={colors.icon} />
          </TouchableOpacity>

          {/* pages button */}
          <FlatList
            data={displayPage(currentPage)}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
            }}
            horizontal={true}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    {
                      borderColor:
                        item === currentPage ? colors.icon : colors.borderColor,
                      backgroundColor: colors.pageButton,
                      borderWidth: item === currentPage ? 3 : 2,
                    },
                  ]}
                  onPress={() => {
                    setFetchTrigger(true);
                    setCurrentPage(item);
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: colors.title,
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* next page button */}
          <TouchableOpacity
            style={[
              styles.arrowButton,
              {
                opacity:
                  totalPages === 0 || initialLoading
                    ? 0
                    : currentPage === totalPages
                    ? 0.3
                    : 1,
              },
            ]}
            disabled={currentPage === totalPages ? true : false}
            onPress={() => {
              setFetchTrigger(true);
              setCurrentPage((prev) => prev + 1);
            }}
          >
            <Icon type="entypo" name="chevron-right" color={colors.icon} />
          </TouchableOpacity>
          {/* last page button */}
          <TouchableOpacity
            style={[
              styles.arrowButton,
              {
                opacity:
                  totalPages === 0 || initialLoading
                    ? 0
                    : currentPage === totalPages
                    ? 0.3
                    : 1,
              },
            ]}
            disabled={currentPage === totalPages ? true : false}
            onPress={() => {
              setFetchTrigger(true);
              setCurrentPage((prev) => totalPages);
            }}
          >
            <Icon name="last-page" color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Artwork;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    paddingLeft: 24,
  },
  artContent: {
    flex: 12,
  },
  pages: {
    flexDirection: "row",
    height: 60,
    paddingTop: 20,
  },
  pageButton: {
    opacity: 0.8,
    borderRadius: 10,
    height: 40,
    width: 40,
    marginHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowButton: {
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
