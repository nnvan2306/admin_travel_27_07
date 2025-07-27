import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import appReducer from './appSlice';
import layoutReducer from './layoutSlice';
import pageReducer from './pageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    layout: layoutReducer,
    page: pageReducer,
  },
});

// Các kiểu hỗ trợ TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
