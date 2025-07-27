import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface AppState {
  pageTitle: string;
}

const initialState: AppState = {
  pageTitle: 'Trang quản trị',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setPageTitle(state, action: PayloadAction<string>) {
      state.pageTitle = action.payload;
    },
  },
});

export const { setPageTitle } = appSlice.actions;
export default appSlice.reducer;
