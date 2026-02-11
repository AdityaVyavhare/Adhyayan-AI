import { useColorScheme } from '@/hooks/use-color-scheme';
import { setUserProfile } from '@/store/profileSlice';
import { store } from '@/store/store';
import { ClerkLoaded, ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider, useDispatch } from 'react-redux';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
        dispatch(setUserProfile({
            userId: user.primaryEmailAddress?.emailAddress || '',
            username: user.username || user.fullName || 'User',
            avatarUrl: user.imageUrl,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
        }));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/');
    } else if (!isSignedIn && !inAuthGroup && segments[0] !== '(auth)') {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, segments, isLoaded]);

  return <Slot />;
}

export default function RootLayout() {
  useColorScheme();

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <Provider store={store}>
          <InitialLayout />
        </Provider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
