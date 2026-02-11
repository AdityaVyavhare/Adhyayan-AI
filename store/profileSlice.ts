import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  userId: string; // email as per request
  username: string;
  avatarUrl: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProfileState {
  user: UserProfile | null;
  isLoading: boolean;
}

const initialState: ProfileState = {
  user: null,
  isLoading: true,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isLoading = false;
    },
    clearUserProfile: (state) => {
      state.user = null;
      state.isLoading = false;
    },
  },
});

export const { setUserProfile, clearUserProfile } = profileSlice.actions;
export default profileSlice.reducer;
