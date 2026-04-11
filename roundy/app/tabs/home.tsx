import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const mockTransactions = [
  { id:'1', merchant:'ארומה קפה', amount:18.50, round_up:1.50, category:'קפה' },
  { id:'2', merchant:'וולט', amount:82.00, round_up:3.00, category:'אוכל' },
  { id:'3', merchant:'סופר-פארם', amount:54.20, round_up:0.80, category:'בריאות' },
  { id:'4', merchant:'פז תדלוק', amount:198.00, round_up:2.00, category:'תחבורה' },
];

const categoryEmoji = { 'קפה':'☕', 'אוכל':'🍕', 'בריאות':'💊', 'תחבורה':'⛽', 'קניות':'🛍️' };
const categoryColor = { 'קפה':'#fff0e8', 'אוכל':'#f0e8ff', 'בריאות':'#e8fff4', 'תחבורה':'#e8f4ff', 'קניות':'#fff8e8' };

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [totalSaved, setTotalSaved] = useState(347.50);
  const [userName, setUserName] = useState('');

  // Animations
  const piggyAnim = useRef(new Animated.Value(0)).current;
  const coinAnim1 = useRef(new Animated.Value(0)).current;
  const coinAnim2 = useRef(new Animated.Value(0)).current;
  const coinAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const amountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) { setProfile(prof); setUserName(prof.full_name?.split(' ')[0] || 'חבר'); }
      const { data: goalsData } = await supabase.from('goals').select('*').eq('user_id', user.id);
      if (goalsData) setGoals(goalsData);
    }
  }

  function startAnimations() {
    // Fade in
    Animated.timing(fadeAnim, { toValue:1, duration:800, useNativeDriver:true }).start();

    // Piggy float
    Animated.loop(
      Animated.sequence([
        Animated.timing(piggyAnim, { toValue:-10, duration:1200, useNativeDriver:true }),
        Animated.timing(piggyAnim, { toValue:0, duration:1200, useNativeDriver:true }),
      ])
    ).start();

    // Coins
    function animateCoin(anim, delay) {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue:1, duration:1000, useNativeDriver:true }),
            Animated.timing(anim, { toValue:0, duration:500, useNativeDriver:true }),
            Animated.delay(1500),
          ])
        ).start();
      }, delay);
    }
    animateCoin(coinAnim1, 0);
    animateCoin(coinAnim2, 500);
    animateCoin(coinAnim3, 1000);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  }

  const coinStyle = (anim, dx, dy) => ({
    opacity: anim,
    transform: [
      { translateX: anim.interpolate({ inputRange:[0,1], outputRange:[0, dx] }) },
      { translateY: anim.interpolate({ inputRange:[0,1], outputRange:[0, dy] }) },
      { scale: anim.interpolate({ inputRange:[0,0.5,1], outputRange:[0.5,1,0.7] }) },
    ]
  });

  return (
    <Animated.View style={[styles.container, {opacity:fadeAnim}]}>
      {/* Dark Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.hi}>שלום,</Text>
            <Text style={styles.name}>{userName} 👋</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={signOut}>
            <Text style={{fontSize:18}}>🧑</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.savingsRow}>
          <View style={{flex:1}}>
            <Text style={styles.savingsLabel}>חסכת החודש</Text>
            <Text style={styles.savingsAmount}>₪{totalSaved.toFixed(2)}</Text>
            <Text style={styles.savingsSub}>מ-142 עסקאות שעוגלו ✨</Text>
            <View style={styles.pill}>
              <View style={styles.pillDot}/>
              <Text style={styles.pillText}>בסוף החודש הכסף יעבור לחיסכון</Text>
            </View>
          </View>

          {/* Animated Piggy */}
          <View style={styles.piggyWrap}>
            <Animated.Text style={[styles.coinFloat, coinStyle(coinAnim1, -20, -30)]}>🪙</Animated.Text>
            <Animated.Text style={[styles.coinFloat, coinStyle(coinAnim2, 10, -35)]}>💫</Animated.Text>
            <Animated.Text style={[styles.coinFloat, coinStyle(coinAnim3, -5, -25)]}>✨</Animated.Text>
            <Animated.Text style={[styles.piggy, {transform:[{translateY:piggyAnim}]}]}>🐷</Animated.Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Insight */}
        <View style={styles.insight}>
          <Text style={{fontSize:18}}>💡</Text>
          <Text style={styles.insightText}>הוצאת <Text style={{color:'#48c8e8',fontWeight:'700'}}>₪340</Text> על קפה החודש — יותר מ-80% מהמשתמשים!</Text>
        </View>

        {/* Goals */}
        <View style={styles.secRow}>
          <Text style={styles.secTitle}>היעדים שלי</Text>
          <TouchableOpacity onPress={() => router.push('/tabs/goals')}>
            <Text style={styles.secMore}>+ יעד חדש</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <TouchableOpacity style={styles.emptyGoals} onPress={() => router.push('/tabs/goals')}>
            <Text style={{fontSize:32}}>🎯</Text>
            <Text style={styles.emptyGoalsText}>הוסף יעד חיסכון ראשון</Text>
          </TouchableOpacity>
        ) : goals.map(goal => {
          const pct = Math.min(Math.round((goal.current_amount/goal.target_amount)*100), 100);
          return (
            <View key={goal.id} style={styles.goalCard}>
              <Text style={{fontSize:26}}>{goal.emoji}</Text>
              <View style={{flex:1, marginHorizontal:12}}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <View style={styles.goalBar}>
                  <View style={[styles.goalFill, {width:`${pct}%`}]}/>
                </View>
              </View>
              <View>
                <Text style={styles.goalPct}>{pct}%</Text>
                <Text style={styles.goalTarget}>₪{goal.target_amount?.toLocaleString()}</Text>
              </View>
            </View>
          );
        })}

        {/* Transactions */}
        <View style={styles.secRow}>
          <Text style={styles.secTitle}>עיגולים אחרונים</Text>
          <Text style={styles.secMore}>הכל ←</Text>
        </View>

        {mockTransactions.map(tx => (
          <View key={tx.id} style={styles.txItem}>
            <View style={[styles.txIcon, {backgroundColor: categoryColor[tx.category] || '#f0f8fc'}]}>
              <Text style={{fontSize:16}}>{categoryEmoji[tx.category] || '💳'}</Text>
            </View>
            <View style={{flex:1, marginHorizontal:10}}>
              <Text style={styles.txName}>{tx.merchant}</Text>
              <Text style={styles.txAmount}>₪{tx.amount}</Text>
            </View>
            <Text style={styles.txSaved}>+₪{tx.round_up}</Text>
          </View>
        ))}

        <View style={{height:20}}/>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f2f8fc' },
  header: { backgroundColor:'#0f2040', paddingHorizontal:20, paddingTop:52, paddingBottom:20 },
  headerTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  hi: { fontSize:12, color:'rgba(255,255,255,0.45)' },
  name: { fontSize:20, fontWeight:'900', color:'#fff', letterSpacing:-0.5 },
  avatar: { width:38, height:38, borderRadius:19, backgroundColor:'#1a3a5c', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(72,200,232,0.2)' },
  savingsRow: { flexDirection:'row', alignItems:'center' },
  savingsLabel: { fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:1.5, textTransform:'uppercase' },
  savingsAmount: { fontSize:44, fontWeight:'900', color:'#fff', letterSpacing:-2, lineHeight:50 },
  savingsSub: { fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:10 },
  pill: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(255,255,255,0.07)', borderRadius:100, paddingHorizontal:10, paddingVertical:5, alignSelf:'flex-start' },
  pillDot: { width:5, height:5, borderRadius:3, backgroundColor:'#38d4c0' },
  pillText: { fontSize:10, color:'rgba(255,255,255,0.45)' },
  piggyWrap: { width:90, height:90, alignItems:'center', justifyContent:'center', position:'relative' },
  piggy: { fontSize:64 },
  coinFloat: { position:'absolute', fontSize:14, top:10, left:40 },
  body: { flex:1, padding:16 },
  insight: { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#0f2040', borderRadius:16, padding:14, marginBottom:14 },
  insightText: { fontSize:12, color:'rgba(255,255,255,0.55)', flex:1, lineHeight:18 },
  secRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  secTitle: { fontSize:15, fontWeight:'800', color:'#1e3d50' },
  secMore: { fontSize:12, color:'#48c8e8', fontWeight:'600' },
  emptyGoals: { backgroundColor:'#fff', borderRadius:16, padding:20, alignItems:'center', gap:8, marginBottom:14, borderWidth:1.5, borderColor:'rgba(72,200,232,0.15)', borderStyle:'dashed' },
  emptyGoalsText: { fontSize:13, color:'#9ac0d0', fontWeight:'600' },
  goalCard: { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:10, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  goalName: { fontSize:13, fontWeight:'600', color:'#1e3d50', marginBottom:6 },
  goalBar: { height:5, backgroundColor:'#eef5f8', borderRadius:10, overflow:'hidden' },
  goalFill: { height:'100%', backgroundColor:'#48c8e8', borderRadius:10 },
  goalPct: { fontSize:16, fontWeight:'900', color:'#1e3d50', textAlign:'right' },
  goalTarget: { fontSize:10, color:'#9ac0d0', textAlign:'right', marginTop:1 },
  txItem: { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:14, padding:12, marginBottom:8, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:6, elevation:1 },
  txIcon: { width:36, height:36, borderRadius:12, alignItems:'center', justifyContent:'center' },
  txName: { fontSize:13, fontWeight:'600', color:'#1e3d50' },
  txAmount: { fontSize:10, color:'#9ac0d0', marginTop:1 },
  txSaved: { fontSize:14, fontWeight:'900', color:'#38d4c0' },
});
