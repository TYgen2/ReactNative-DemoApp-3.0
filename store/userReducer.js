import { createSlice } from "@reduxjs/toolkit";
import { getInfo } from "./profileInfoAction";

const initialState = {
  user: "",
  isGuest: false,
  info: [],
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginUser: (state, action) => {
      state.user = action.payload;
      state.isGuest = false;
    },
    isGuest: (state) => {
      state.isGuest = true;
    },
    logout: (state) => {
      state.info = [];
      state.user = "";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getInfo.fulfilled, (state, action) => {
      state.info = action.payload;
    });
  },
});

// Action creators are generated for each case reducer function
export const { loginUser, isGuest, logout } = userSlice.actions;

export default userSlice.reducer;
