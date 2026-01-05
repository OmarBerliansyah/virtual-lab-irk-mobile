import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  // On web, immediately redirect to login without auth check
  // The auth check will happen in _layout
  return <Redirect href="/login" />;
}
