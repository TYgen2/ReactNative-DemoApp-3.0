import Artwork from "../pages/tabs/artwork";
import Favourites from "../pages/tabs/favourites";

const TabArr = [
  {
    route: "Artwork",
    label: "Artwork",
    icon: "home",
    type: "entypo",
    color: "#815e4e",
    bgColor: "#feecb3",
    component: Artwork,
  },
  {
    route: "Favourites",
    label: "Favourites",
    icon: "heart",
    type: "entypo",
    color: "#f44234",
    bgColor: "#ffcdd2",
    component: Favourites,
  },
];

export default TabArr;
