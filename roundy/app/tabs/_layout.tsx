import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#f2f8fc',
        borderTopColor: 'rgba(100,210,240,0.12)',
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
      },
      tabBarActiveTintColor: '#48c8e8',
      tabBarInactiveTintColor: '#9ac0d0',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tabs.Screen name="home" options={{ title:'בית', tabBarIcon: ({color}) => <Text style={{fontSize:20}}>🏠</Text> }}/>
      <Tabs.Screen name="goals" options={{ title:'יעדים', tabBarIcon: ({color}) => <Text style={{fontSize:20}}>🎯</Text> }}/>
      <Tabs.Screen name="history" options={{ title:'היסטוריה', tabBarIcon: ({color}) => <Text style={{fontSize:20}}>📋</Text> }}/>
      <Tabs.Screen name="settings" options={{ title:'הגדרות', tabBarIcon: ({color}) => <Text style={{fontSize:20}}>⚙️</Text> }}/>
    </Tabs>
  );
}
