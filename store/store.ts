import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import profileReducer from './profileSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
