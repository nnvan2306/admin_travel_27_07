import { createSlice } from "@reduxjs/toolkit";

interface LayoutState {
  isSidebarOpen: boolean;
  collapsed: boolean;
}

const initialState: LayoutState = {
  isSidebarOpen: true,
  collapsed: false,
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleCollapse(state) {
      state.collapsed = !state.collapsed;
    },
  },
});

export const { toggleSidebar, toggleCollapse } = layoutSlice.actions;
export default layoutSlice.reducer;
