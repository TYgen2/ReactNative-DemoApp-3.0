import { Text, TouchableOpacity, Image, View, StyleSheet } from "react-native";
import { likeComment } from "../services/cloudFunctions";
import { Icon } from "@rneui/themed";
import { useContext, useState } from "react";
import { useTheme } from "../context/themeProvider";
import { functions } from "../firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { UpdateContext } from "../context/updateArt";
import { sleep } from "../utils/tools";
import AlertAsync from "react-native-alert-async";
import Toast from "react-native-toast-message";

const CommentItem = ({
  createdTime,
  commenterIcon,
  commenterName,
  commentFavStatus,
  commentLikeCount,
  commentUser,
  commentID,
  comment,
  user,
  artworkId,
}) => {
  // get initial fav status from Firestore
  const [favStatus, setFavStatus] = useState(commentFavStatus);
  const [likeCount, setLikeCount] = useState(commentLikeCount);

  const { colors } = useTheme();
  const { commentTrigger, setCommentTrigger } = useContext(UpdateContext);

  const time = new Date(createdTime._seconds * 1000);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - time.getTime()) / 1000) + 5;

  // delete comment in Firestore using CLOUD FUNCTION
  const deleteComment = async () => {
    const fetchMetaCallable = httpsCallable(functions, "deleteComment");
    fetchMetaCallable({ commentId: commentID }).then(() => {
      setCommentTrigger(!commentTrigger);
    });
  };

  return (
    <TouchableOpacity
      style={styles.comment}
      onLongPress={async () => {
        if (user === commentUser) {
          const choice = await AlertAsync(
            "Caution❗",
            "Are you sure you want to delete this comment?",
            [
              { text: "Yes", onPress: () => "yes" },
              { text: "No", onPress: () => Promise.resolve("no") },
            ],
            {
              cancelable: true,
              onDismiss: () => "no",
            }
          );
          if (choice === "yes") {
            deleteComment().then(() => {
              Toast.show({
                type: "success",
                text1: "Successfully deleted.",
                position: "bottom",
                visibilityTime: 2000,
              });
            });
          } else {
            return;
          }
        }
      }}
    >
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
      <View style={{ alignItems: "center", marginRight: 4 }}>
        <Text style={styles.like}>{likeCount}</Text>
        <TouchableOpacity
          style={{}}
          onPress={() => {
            const likeJSON = {
              userId: user,
              commentId: commentID,
              artworkId: artworkId,
              favStatus: favStatus,
            };

            setLikeCount(favStatus ? likeCount - 1 : likeCount + 1);
            setFavStatus(!favStatus);

            likeComment(likeJSON);
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  comment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  like: {
    color: "grey",
    fontSize: 12,
    fontWeight: "bold",
    paddingVertical: 2,
  },
});

export default CommentItem;
