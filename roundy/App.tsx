import "react-native-url-polyfill/auto";
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput, Animated,
  SafeAreaView, StatusBar, I18nManager, Dimensions, FlatList,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import Svg, { Ellipse, Circle, Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { supabase } from './lib/supabase';
import { calculateRoundUp, categorizeTransaction } from './lib/roundup';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#F8FAFC',
  cyan: '#00B4D8',
  cyanGlow: 'rgba(0, 180, 216, 0.15)',
  textDark: '#0F172A',
  textMuted: '#475569',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  danger: '#EF4444'
};

const ONBOARDING_SLIDES = [
  { id: '1', title: 'חוסכים בלי להרגיש', desc: 'Roundy מעגלת את העסקאות היומיומיות שלך ושומרת את העודף.', icon: '✨' },
  { id: '2', title: 'איך זה עובד?', desc: 'קנית קפה ב-18.50 ₪? נעגל ל-20.00 ₪ ונעביר 1.50 ₪ לחיסכון.', icon: '☕' },
  { id: '3', title: 'מגשימים יעדים', desc: 'חופשה? רכב חדש? הקופה תתמלא מעצמה על אוטומט.', icon: '🎯' }
];

const MOCK_TRANSACTIONS = [
  { id: '1', merchant: 'ארומה קפה', amount: 18.50, date: 'היום, 08:30' },
  { id: '2', merchant: 'וולט פיצה', amount: 82.00, date: 'אתמול' },
  { id: '3', merchant: 'סופר-פארם', amount: 54.20, date: 'אתמול' },
  { id: '4', merchant: 'פז תדלוק', amount: 198.00, date: 'לפני יומיים' },
];

// ── PiggyBank SVG ──
const PiggyBank = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -8, duration: 1800, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }], alignItems: 'center' }}>
      <Svg height="150" width="150" viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="pigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFB6C1" />
            <Stop offset="100%" stopColor="#FF8DA1" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="100" cy="110" rx="60" ry="50" fill="url(#pigGrad)" />
        <Circle cx="155" cy="115" r="12" fill="#FFB6C1" />
        <Rect x="70" y="150" width="12" height="25" rx="4" fill="#FF8DA1" />
        <Rect x="115" y="150" width="12" height="25" rx="4" fill="#FF8DA1" />
        <Ellipse cx="50" cy="120" rx="18" ry="15" fill="#FF8DA1" />
        <Circle cx="45" cy="120" r="3" fill="#D64561" />
        <Circle cx="55" cy="120" r="3" fill="#D64561" />
        <Circle cx="75" cy="100" r="4" fill="#2D3436" />
        <Circle cx="76" cy="99" r="1.5" fill="#FFF" />
        <Path d="M80 70 L95 50 L110 75 Z" fill="#FFB6C1" />
        <Path d="M120 70 L135 50 L150 75 Z" fill="#FFB6C1" />
        <Rect x="90" y="65" width="20" height="4" rx="2" fill="#D64561" opacity="0.5" />
        <Ellipse cx="100" cy="120" rx="30" ry="15" fill="rgba(255,255,255,0.2)" />
      </Svg>
    </Animated.View>
  );
};

// ── Onboarding ──
const OnboardingScreen = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;

  return (
    <View style={styles.flexContainer}>
      <Text style={styles.logoTop}>Roundy 🐷</Text>
      <FlatList
        data={ONBOARDING_SLIDES} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        bounces={false} keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        ref={slidesRef}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: 'center', padding: 40, paddingTop: 60 }}>
            <View style={styles.onboardIconBg}><Text style={{ fontSize: 60 }}>{item.icon}</Text></View>
            <Text style={styles.titleCenter}>{item.title}</Text>
            <Text style={styles.descCenter}>{item.desc}</Text>
          </View>
        )}
      />
      <View style={{ padding: 30 }}>
        <View style={styles.paginator}>
          {ONBOARDING_SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({ inputRange: [(i-1)*width, i*width, (i+1)*width], outputRange: [8,20,8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange: [(i-1)*width, i*width, (i+1)*width], outputRange: [0.3,1,0.3], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />;
          })}
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={currentIndex === ONBOARDING_SLIDES.length - 1 ? onFinish : () => slidesRef.current.scrollToIndex({ index: currentIndex + 1 })}>
          <Text style={styles.btnPrimaryText}>{currentIndex === ONBOARDING_SLIDES.length - 1 ? 'התחל עכשיו' : 'המשך'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Auth ──
const AuthScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) { Alert.alert('שגיאה', 'יש למלא אימייל וסיסמה'); return; }
    setLoading(true);
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { Alert.alert('שגיאה', error.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName, round_up_amount: 10 });
        onLogin();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { Alert.alert('שגיאה', 'אימייל או סיסמה שגויים'); setLoading(false); return; }
      onLogin();
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.paddedContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.logoTop}>Roundy 🐷</Text>
      <Text style={styles.titleLeft}>{isSignUp ? 'יצירת חשבון' : 'ברוך הבא'}</Text>
      <Text style={styles.descLeft}>{isSignUp ? 'מוכן להתחיל לחסוך?' : 'התחבר לחשבון שלך'}</Text>
      <View style={{ marginTop: 30, gap: 12 }}>
        {isSignUp && <TextInput style={styles.input} placeholder="שם מלא" value={fullName} onChangeText={setFullName} textAlign="right" />}
        <TextInput style={styles.input} placeholder="אימייל" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textAlign="right" />
        <TextInput style={styles.input} placeholder="סיסמה" value={password} onChangeText={setPassword} secureTextEntry textAlign="right" />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth} disabled={loading}>
          <Text style={styles.btnPrimaryText}>{loading ? 'טוען...' : isSignUp ? 'הרשמה' : 'כניסה'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: COLORS.cyan, fontWeight: '600' }}>{isSignUp ? 'יש לי חשבון — התחבר' : 'אין לי חשבון — הרשם'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ── Home ──
const HomeScreen = ({ onSignOut }) => {
  const [userName, setUserName] = useState('');
  const [goals, setGoals] = useState([]);
  const [roundUpAmount, setRoundUpAmount] = useState(10);

  const txWithRoundups = MOCK_TRANSACTIONS.map(tx => ({
    ...tx,
    round_up: calculateRoundUp(tx.amount, roundUpAmount),
    category: categorizeTransaction(tx.merchant),
  }));
  const totalSaved = parseFloat(txWithRoundups.reduce((s, t) => s + t.round_up, 0).toFixed(2));

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) { setUserName(prof.full_name?.split(' ')[0] || 'חבר'); setRoundUpAmount(prof.round_up_amount || 10); }
      const { data: goalsData } = await supabase.from('goals').select('*').eq('user_id', user.id);
      if (goalsData) setGoals(goalsData);
    }
  }

  return (
    <FlatList
      data={[{ key: 'content' }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={() => (
        <View>
          <View style={styles.header}>
            <Text style={styles.logoSmall}>Roundy 🐷</Text>
            <TouchableOpacity style={styles.avatar} onPress={onSignOut}>
              <Text>👤</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={styles.titleLeft}>שלום, {userName} 👋</Text>
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <PiggyBank />
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.descCenter}>נצבר החודש לקופה</Text>
              <Text style={{ fontSize: 50, fontWeight: '900', color: COLORS.textDark, marginVertical: 10, textAlign: 'center' }}>
                ₪{Math.floor(totalSaved)}<Text style={{ fontSize: 24, color: COLORS.cyan }}>.{String(totalSaved.toFixed(2)).split('.')[1]}</Text>
              </Text>
              <View style={styles.badge}><Text style={styles.badgeText}>✨ מ-{MOCK_TRANSACTIONS.length} עסקאות שעוגלו</Text></View>
            </View>

            <Text style={[styles.titleLeft, { fontSize: 20, marginTop: 24, marginBottom: 12 }]}>היעדים שלי</Text>
            {goals.length === 0 ? (
              <View style={[styles.balanceCard, { padding: 20, alignItems: 'center' }]}>
                <Text style={{ fontSize: 32 }}>🎯</Text>
                <Text style={styles.descCenter}>עבור ליעדים כדי להוסיף יעד ראשון</Text>
              </View>
            ) : goals.map(goal => {
              const pct = Math.min(Math.round((goal.current_amount/goal.target_amount)*100), 100);
              return (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTitle}>{goal.emoji} {goal.name}</Text>
                    <View style={{ height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
                      <View style={{ height: '100%', width: pct+'%', backgroundColor: COLORS.cyan, borderRadius: 3 }} />
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.cyan, marginRight: 12 }}>{pct}%</Text>
                </View>
              );
            })}

            <Text style={[styles.titleLeft, { fontSize: 20, marginTop: 24, marginBottom: 12 }]}>עיגולים אחרונים</Text>
            {txWithRoundups.map(tx => (
              <View key={tx.id} style={styles.txCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txPlace}>{tx.merchant}</Text>
                  <Text style={styles.txDate}>{tx.date} | ₪{tx.amount}</Text>
                </View>
                <Text style={styles.txSaved}>+₪{tx.round_up}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    />
  );
};

// ── Goals ──
const GoalsScreen = () => {
  const [goals, setGoals] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newEmoji, setNewEmoji] = useState('✈️');
  const emojis = ['✈️','🚗','🏠','💍','📱','🎓','🏖️'];

  useEffect(() => { loadGoals(); }, []);

  async function loadGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('goals').select('*').eq('user_id', user.id);
      if (data) setGoals(data);
    }
  }

  async function addGoal() {
    if (!newTitle || !newAmount) { Alert.alert('שגיאה', 'יש למלא את כל השדות'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('goals').insert({ user_id: user.id, name: newTitle, target_amount: Number(newAmount), emoji: newEmoji, current_amount: 0 }).select().single();
      if (data) setGoals([...goals, data]);
    }
    setNewTitle(''); setNewAmount('');
  }

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(goals.filter(g => g.id !== id));
  }

  return (
    <FlatList
      data={goals}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 24, paddingBottom: 20 }}
      ListHeaderComponent={() => (
        <View>
          <Text style={styles.titleLeft}>היעדים שלי 🎯</Text>
          <View style={styles.addGoalCard}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {emojis.map(e => (
                <TouchableOpacity key={e} onPress={() => setNewEmoji(e)} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: newEmoji === e ? COLORS.cyanGlow : '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: newEmoji === e ? 1.5 : 0, borderColor: COLORS.cyan }}>
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.inputSmall} placeholder="שם היעד" value={newTitle} onChangeText={setNewTitle} textAlign="right" />
            <TextInput style={styles.inputSmall} placeholder="סכום יעד (₪)" keyboardType="numeric" value={newAmount} onChangeText={setNewAmount} textAlign="right" />
            <TouchableOpacity style={styles.btnPrimary} onPress={addGoal}>
              <Text style={styles.btnPrimaryText}>+ הוסף יעד</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      renderItem={({ item }) => {
        const pct = Math.min(Math.round((item.current_amount/item.target_amount)*100), 100);
        return (
          <View style={styles.goalItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalTitle}>{item.emoji} {item.name}</Text>
              <Text style={styles.goalAmount}>₪{item.current_amount} מתוך ₪{item.target_amount?.toLocaleString()}</Text>
              <View style={{ height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
                <View style={{ height: '100%', width: pct+'%', backgroundColor: COLORS.cyan, borderRadius: 3 }} />
              </View>
            </View>
            <View style={{ alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.cyan }}>{pct}%</Text>
              <TouchableOpacity onPress={() => deleteGoal(item.id)} style={styles.deleteBtn}>
                <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: 'bold' }}>מחק</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
};

// ── History ──
const HistoryScreen = () => {
  const [roundUpAmount] = useState(10);
  const txWithRoundups = MOCK_TRANSACTIONS.map(tx => ({
    ...tx,
    round_up: calculateRoundUp(tx.amount, roundUpAmount),
  }));
  const total = txWithRoundups.reduce((s, t) => s + t.round_up, 0).toFixed(2);

  return (
    <FlatList
      data={txWithRoundups}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 24, paddingBottom: 20 }}
      ListHeaderComponent={() => (
        <View>
          <Text style={styles.titleLeft}>היסטוריה 📋</Text>
          <View style={[styles.balanceCard, { marginBottom: 16 }]}>
            <Text style={styles.descCenter}>סה״כ עוגל החודש</Text>
            <Text style={{ fontSize: 36, fontWeight: '900', color: COLORS.cyan, textAlign: 'center' }}>₪{total}</Text>
          </View>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.txCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txPlace}>{item.merchant}</Text>
            <Text style={styles.txDate}>{item.date} | ₪{item.amount}</Text>
          </View>
          <Text style={styles.txSaved}>+₪{item.round_up}</Text>
        </View>
      )}
    />
  );
};

// ── Settings ──
const SettingsScreen = ({ onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [roundUp, setRoundUp] = useState(10);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) { setProfile(data); setRoundUp(data.round_up_amount || 10); }
    }
  }

  async function updateRoundUp(amount) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ round_up_amount: amount }).eq('id', user.id);
      setRoundUp(amount);
    }
  }

  return (
    <FlatList
      data={[{ key: 'content' }]}
      contentContainerStyle={{ padding: 24, paddingBottom: 20 }}
      renderItem={() => (
        <View>
          <Text style={styles.titleLeft}>הגדרות ⚙️</Text>
          <View style={[styles.balanceCard, { marginBottom: 16, flexDirection: 'row', alignItems: 'center' }]}>
            <Text style={{ fontSize: 40, marginLeft: 16 }}>🧑</Text>
            <View>
              <Text style={styles.goalTitle}>{profile?.full_name || 'המשתמש שלי'}</Text>
              <Text style={styles.descLeft}>חוסך עם Roundy 🐷</Text>
            </View>
          </View>

          <Text style={[styles.titleLeft, { fontSize: 18, marginBottom: 10 }]}>הגדרות עיגול</Text>
          {[5, 10].map(amt => (
            <TouchableOpacity key={amt} style={[styles.goalItem, roundUp === amt && { borderWidth: 1.5, borderColor: COLORS.cyan, backgroundColor: COLORS.cyanGlow }]} onPress={() => updateRoundUp(amt)}>
              <View>
                <Text style={styles.goalTitle}>עיגול ל-{amt} ₪ הקרובים</Text>
                <Text style={styles.goalAmount}>קנייה ב-12 ₪ → חיסכון של {amt === 5 ? 3 : 8} ₪</Text>
              </View>
              {roundUp === amt && <Text style={{ color: COLORS.cyan, fontSize: 20 }}>✓</Text>}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: COLORS.danger, marginTop: 30 }]} onPress={onLogout}>
            <Text style={styles.btnPrimaryText}>התנתק</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

// ── Bottom Nav ──
const BottomNav = ({ current, onNavigate }) => {
  const tabs = [
    { id: 'Settings', icon: '⚙️', label: 'הגדרות' },
    { id: 'History', icon: '📋', label: 'היסטוריה' },
    { id: 'Goals', icon: '🎯', label: 'יעדים' },
    { id: 'Home', icon: '🏠', label: 'בית' },
  ];
  return (
    <View style={styles.bottomNav}>
      {tabs.map(tab => (
        <TouchableOpacity key={tab.id} style={[styles.navItem, current === tab.id && styles.navItemActive]} onPress={() => onNavigate(tab.id)}>
          <Text style={{ fontSize: 22 }}>{tab.icon}</Text>
          <Text style={[styles.navLabel, current === tab.id && { color: COLORS.cyan, fontWeight: 'bold' }]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ── Root ──
export default function App() {
  const [screen, setScreen] = useState('Onboarding');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setScreen('Home');
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setScreen('Onboarding');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {screen === 'Onboarding' && <OnboardingScreen onFinish={() => setScreen('Auth')} />}
      {screen === 'Auth' && <AuthScreen onLogin={() => setScreen('Home')} />}
      {['Home', 'Goals', 'History', 'Settings'].includes(screen) && (
        <View style={{ flex: 1 }}>
          {screen === 'Home' && <HomeScreen onSignOut={handleSignOut} />}
          {screen === 'Goals' && <GoalsScreen />}
          {screen === 'History' && <HistoryScreen />}
          {screen === 'Settings' && <SettingsScreen onLogout={handleSignOut} />}
          <BottomNav current={screen} onNavigate={setScreen} />
        </View>
      )}
    </SafeAreaView>
  );
}

import { AppRegistry } from 'react-native';
AppRegistry.registerComponent('main', () => App);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flexContainer: { flex: 1 },
  paddedContainer: { flex: 1, padding: 24, paddingTop: 20 },
  logoTop: { fontSize: 28, fontWeight: '900', color: COLORS.textDark, textAlign: 'center', marginVertical: 20 },
  logoSmall: { fontSize: 22, fontWeight: '900', color: COLORS.textDark },
  titleCenter: { fontSize: 28, fontWeight: '900', color: COLORS.textDark, textAlign: 'center', marginBottom: 10 },
  descCenter: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  titleLeft: { fontSize: 32, fontWeight: '900', color: COLORS.textDark, marginBottom: 8 },
  descLeft: { fontSize: 14, color: COLORS.textMuted },
  btnPrimary: { backgroundColor: COLORS.cyan, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  input: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, fontSize: 16, marginBottom: 12 },
  inputSmall: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 12, marginBottom: 10 },
  onboardIconBg: { width: 120, height: 120, backgroundColor: COLORS.cardBg, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 40, elevation: 5 },
  paginator: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { height: 8, borderRadius: 4, backgroundColor: COLORS.cyan, marginHorizontal: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  balanceCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  badge: { backgroundColor: COLORS.cyanGlow, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 10 },
  badgeText: { color: COLORS.cyan, fontWeight: 'bold' },
  addGoalCard: { backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 20, marginBottom: 16, elevation: 2 },
  goalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 16, marginBottom: 10, elevation: 1 },
  goalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  goalAmount: { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8, marginTop: 6 },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 16, marginBottom: 10, elevation: 1 },
  txPlace: { fontSize: 15, fontWeight: 'bold', color: COLORS.textDark },
  txDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  txSaved: { fontSize: 18, fontWeight: '900', color: COLORS.cyan },
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.cardBg, paddingVertical: 12, paddingHorizontal: 10, borderTopWidth: 1, borderColor: COLORS.border, justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 28 : 12 },
  navItem: { alignItems: 'center', flex: 1, paddingVertical: 5 },
  navItemActive: { backgroundColor: COLORS.cyanGlow, borderRadius: 14 },
  navLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
});
