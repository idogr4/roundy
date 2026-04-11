import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Celebration() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const coin1 = useRef(new Animated.Value(0)).current;
  const coin2 = useRef(new Animated.Value(0)).current;
  const coin3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue:1, friction:4, useNativeDriver:true }).start();
    Animated.timing(fadeAnim, { toValue:1, duration:800, delay:400, useNativeDriver:true }).start();
    [coin1, coin2, coin3].forEach((c, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 300),
          Animated.timing(c, { toValue:1, duration:800, useNativeDriver:true }),
          Animated.timing(c, { toValue:0, duration:400, useNativeDriver:true }),
          Animated.delay(1000),
        ])
      ).start();
    });
  }, []);

  const coinStyle = (anim, dx) => ({
    opacity: anim,
    transform: [
      { translateX: dx },
      { translateY: anim.interpolate({ inputRange:[0,1], outputRange:[0,-60] }) },
      { scale: anim.interpolate({ inputRange:[0,0.5,1], outputRange:[0.5,1,0.7] }) },
    ]
  });

  return (
    <View style={s.container}>
      <Animated.View style={[s.content, { transform:[{scale:scaleAnim}] }]}>
        <View style={s.piggyWrap}>
          <Animated.Text style={[s.coin, coinStyle(coin1, -30)]}>🪙</Animated.Text>
          <Animated.Text style={[s.coin, coinStyle(coin2, 0)]}>💫</Animated.Text>
          <Animated.Text style={[s.coin, coinStyle(coin3, 30)]}>🪙</Animated.Text>
          <Text style={s.piggy}>🐷</Text>
        </View>
        <Text style={s.emoji}>🎉</Text>
        <Text style={s.title}>הגעת ליעד!</Text>
        <Text style={s.sub}>חסכת בלי להרגיש כלום{'\n'}כל הכבוד! 🏆</Text>
      </Animated.View>
      <Animated.View style={{opacity:fadeAnim, width:'100%'}}>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/tabs/home')}>
          <Text style={s.btnText}>המשך לחסוך 🚀</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F8FAFC', alignItems:'center', justifyContent:'center', padding:24 },
  content: { alignItems:'center', marginBottom:50 },
  piggyWrap: { position:'relative', alignItems:'center', marginBottom:16 },
  piggy: { fontSize:100 },
  coin: { position:'absolute', fontSize:24, top:0 },
  emoji: { fontSize:48, marginBottom:8 },
  title: { fontSize:36, fontWeight:'900', color:'#0F172A', letterSpacing:-1, marginBottom:12 },
  sub: { fontSize:16, color:'#475569', textAlign:'center', lineHeight:24 },
  btn: { backgroundColor:'#00B4D8', padding:18, borderRadius:20, alignItems:'center', shadowColor:'#00B4D8', shadowOpacity:0.3, shadowRadius:10, shadowOffset:{width:0,height:5} },
  btnText: { color:'#fff', fontWeight:'900', fontSize:18 },
});
