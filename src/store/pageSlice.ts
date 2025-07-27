import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface PageState {
  title: string;
}

const initialState: PageState = {
  title: "Trang quản trị",
};

const pageSlice = createSlice({
  name: "page",
  initialState,
  reducers: {
    setTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
    },
  },
});

export const { setTitle } = pageSlice.actions;
export default pageSlice.reducer;
