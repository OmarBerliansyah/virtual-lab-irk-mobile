import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>Loading...</Text>
      <Redirect href="/login" />
    </View>
  );
}
