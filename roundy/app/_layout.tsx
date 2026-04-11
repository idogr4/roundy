import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"/>
      <Stack.Screen name="auth/login"/>
      <Stack.Screen name="auth/onboarding"/>
      <Stack.Screen name="tabs"/>
    </Stack>
  );
}
