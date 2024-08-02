import { Text, TouchableOpacity, Image, View, StyleSheet } from "react-native";
import { likeComment } from "../services/cloudFunctions";
import { Icon } from "@rneui/themed";
import { useState } from "react";
import { useTheme } from "../context/themeProvider";

const CommentItem = ({
  createdTime,
  commenterIcon,
  commenterName,
  commentFavStatus,
  commentID,
  comment,
  user,
  artworkId,
}) => {
  // get initial fav status from Firestore
  const [favStatus, setFavStatus] = useState(commentFavStatus);

  const { colors } = useTheme();

  const time = new Date(createdTime._seconds * 1000);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - time.getTime()) / 1000) + 5;

  return (
    <View style={styles.comment}>
      <Image
        source={{
          uri: commenterIcon,
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 40,
          marginLeft: 4,
        }}
      />
      <View style={{ flex: 1, marginLeft: 4 }}>
        <View
          style={{
            flexDirection: "row",
            marginLeft: 4,
            marginRight: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.title,
              fontWeight: "bold",
            }}
          >
            {commenterName}
          </Text>
          <Text
            style={{
              color: "grey",
              marginRight: 20,
              fontSize: 12,
              marginLeft: 10,
            }}
          >
            {diffInSec < 60
              ? diffInSec + " seconds ago"
              : diffInSec >= 60 && diffInSec < 3600
              ? Math.floor(diffInSec / 60) + " minutes ago "
              : diffInSec >= 3600 && diffInSec < 86400
              ? Math.floor(diffInSec / 60 / 60) + " hours ago "
              : Math.floor(diffInSec / 60 / 60 / 24) + " days ago"}
          </Text>
        </View>
        <Text
          style={{
            color: colors.title,
            marginLeft: 4,
            marginRight: 20,
          }}
        >
          {comment}
        </Text>
      </View>
      <TouchableOpacity
        style={{ marginRight: 4 }}
        onPress={() => {
          const likeJSON = {
            userId: user,
            commentId: commentID,
            artworkId: artworkId,
            favStatus: favStatus,
          };
          likeComment(likeJSON).then(() => {
            setFavStatus(!favStatus);
          });
        }}
      >
        <Icon
          name={favStatus ? "heart" : "hearto"}
          type="antdesign"
          color={favStatus ? "#ff5152" : "grey"}
          size={20}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  comment: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "grey",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
});

export default CommentItem;
