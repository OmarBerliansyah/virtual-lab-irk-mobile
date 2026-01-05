import { useAuth } from '@/contexts/AuthContext.clerk';
import { Redirect, Stack } from 'expo-router'

export default function AuthRoutesLayout() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Redirect href={'/'} />
  }

  return <Stack />
}