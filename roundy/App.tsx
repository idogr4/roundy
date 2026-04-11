import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput, Animated,
  SafeAreaView, StatusBar, I18nManager, Dimensions, FlatList, Alert
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
  glassBg: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  border: '#E2E8F0',
};

const ONBOARDING_DATA = [
  { id: '1', title: 'חוסכים בלי להרגיש', description: 'Roundy מעגלת את העסקאות היומיומיות שלך ושומרת את העודף. כסף קטן שהופך לחיסכון ענק.', icon: '✨' },
  { id: '2', title: 'איך זה עובד?', description: 'קנית קפה ב-18.50 ₪? נעגל ל-20.00 ₪ ונעביר 1.50 ₪ ישירות לחיסכון שלך.', icon: '☕' },
  { id: '3', title: 'מגשימים יעדים', description: 'חופשה? רכב חדש? בחר יעד והקופה תתמלא מעצמה, על אוטומט.', icon: '🎯' }
];

const MOCK_TRANSACTIONS = [
  { id: '1', merchant: 'ארומה קפה', amount: 18.50, time: 'היום, 08:30' },
  { id: '2', merchant: 'וולט פיצה', amount: 82.00, time: 'אתמול' },
  { id: '3', merchant: 'סופר-פארם', amount: 54.20, time: 'אתמול' },
  { id: '4', merchant: 'פז תדלוק', amount: 198.00, time: 'לפני יומיים' },
];

const categoryEmoji = { 'קפה':'☕', 'אוכל':'🍕', 'בריאות':'💊', 'תחבורה':'⛽', 'סופר':'🛒', 'כללי':'💳' };

// ── PremiumPiggy ──
const PremiumPiggy = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true })
    ])).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }], alignItems: 'center', marginVertical: 20 }}>
      <View style={styles.pigShadow} />
      <Svg height="160" width="160" viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFB6C1" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8DA1" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="100" cy="110" rx="60" ry="50" fill="url(#grad1)" />
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
      </Svg>
    </Animated.View>
  );
};

// ── Onboarding ──
const OnboardingFlow = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;
  return (
    <View style={styles.flexContainer}>
      <Text style={styles.logoTop}>Roundy 🐷</Text>
      <FlatList
        data={ONBOARDING_DATA} horizontal showsHorizontalScrollIndicator={false}
        pagingEnabled bounces={false} keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        ref={slidesRef}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconContainer}><Text style={styles.slideIcon}>{item.icon}</Text></View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDescription}>{item.description}</Text>
          </View>
        )}
      />
      <View style={styles.onboardingFooter}>
        <View style={styles.paginator}>
          {ONBOARDING_DATA.map((_, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: currentIndex === i ? 1 : 0.3, width: currentIndex === i ? 20 : 8 }]} />
          ))}
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={currentIndex === ONBOARDING_DATA.length - 1 ? onFinish : () => slidesRef.current.scrollToIndex({ index: currentIndex + 1 })}>
          <Text style={styles.primaryButtonText}>{currentIndex === ONBOARDING_DATA.length - 1 ? 'בואו נתחיל' : 'המשך'}</Text>
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
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
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
    <View style={styles.paddedContainer}>
      <Text style={styles.logoTop}>Roundy 🐷</Text>
      <Text style={styles.mainTitle}>{isSignUp ? 'יצירת חשבון' : 'כניסה'}</Text>
      <Text style={styles.subText}>{isSignUp ? 'מוכן להתחיל לחסוך באמת?' : 'ברוך הבא בחזרה!'}</Text>
      <View style={styles.inputGroup}>
        {isSignUp && <TextInput style={styles.input} placeholder="שם מלא" placeholderTextColor={COLORS.textMuted} value={fullName} onChangeText={setFullName} textAlign="right" />}
        <TextInput style={styles.input} placeholder="אימייל" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textAlign="right" />
        <TextInput style={styles.input} placeholder="סיסמה" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry textAlign="right" />
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? 'טוען...' : isSignUp ? 'הרשמה' : 'כניסה'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipButton} onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.skipText}>{isSignUp ? 'יש לי חשבון — התחבר' : 'אין לי חשבון — הרשם'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Dashboard ──
const DashboardScreen = ({ onSignOut }) => {
  const [userName, setUserName] = useState('');
  const [goals, setGoals] = useState([]);
  const [roundUpAmount, setRoundUpAmount] = useState(10);

  const txWithRoundups = MOCK_TRANSACTIONS.map(tx => ({
    ...tx,
    round_up: calculateRoundUp(tx.amount, roundUpAmount),
    category: categorizeTransaction(tx.merchant),
  }));
  const totalSaved = parseFloat(txWithRoundups.reduce((s, t) => s + t.round_up, 0).toFixed(2));

  useEffect(() => {
    loadData();
  }, []);

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
    <View style={styles.flexContainer}>
      <View style={styles.dashHeader}>
        <Text style={styles.logoSmall}>Roundy 🐷</Text>
        <TouchableOpacity style={styles.profilePic} onPress={onSignOut}>
          <Text style={{fontSize: 20}}>👤</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={[{key: 'c'}]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24, paddingTop: 10 }}
        renderItem={() => (
          <View>
            <View style={styles.greeting}>
              <Text style={styles.greetingSub}>שלום, {userName} 👋</Text>
              <Text style={styles.greetingTitle}>החיסכון שלך צומח 🚀</Text>
            </View>
            <PremiumPiggy />
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>נצבר החודש לקופה</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceCurrency}>₪</Text>
                <Text style={styles.balanceAmount}>{Math.floor(totalSaved)}</Text>
                <Text style={styles.balanceDecimals}>.{String(totalSaved.toFixed(2)).split('.')[1]}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>✨ מ-{MOCK_TRANSACTIONS.length} עסקאות שעוגלו</Text></View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>היעדים שלי</Text>
              <TouchableOpacity><Text style={styles.linkText}>+ יעד חדש</Text></TouchableOpacity>
            </View>
            {goals.length === 0 ? (
              <View style={styles.emptyGoals}>
                <Text style={{fontSize:32}}>🎯</Text>
                <Text style={styles.emptyGoalsText}>הוסף יעד חיסכון ראשון</Text>
              </View>
            ) : goals.map(goal => {
              const pct = Math.min(Math.round((goal.current_amount/goal.target_amount)*100), 100);
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalRow}>
                    <Text style={styles.goalTitle}>{goal.emoji} {goal.name}</Text>
                    <Text style={styles.goalProgress}>{pct}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: pct + '%' }]} />
                  </View>
                  <Text style={styles.goalTarget}>₪{goal.target_amount?.toLocaleString()} היעד</Text>
                </View>
              );
            })}

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>עיגולים אחרונים</Text></View>
            {txWithRoundups.map(tx => (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txIconBg}><Text style={styles.txIcon}>{categoryEmoji[tx.category] || '💳'}</Text></View>
                <View style={styles.txDetails}>
                  <Text style={styles.txPlace}>{tx.merchant}</Text>
                  <Text style={styles.txTime}>{tx.time} | ₪{tx.amount}</Text>
                </View>
                <Text style={styles.txSaved}>+₪{tx.round_up}</Text>
              </View>
            ))}
          </View>
        )}
      />
      <View style={styles.floatingNav}>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navText}>הגדרות</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navIcon}>📋</Text><Text style={styles.navText}>היסטוריה</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navIcon}>🎯</Text><Text style={styles.navText}>יעדים</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}><Text style={styles.navIconActive}>🏠</Text><Text style={styles.navTextActive}>בית</Text></TouchableOpacity>
      </View>
    </View>
  );
};

// ── Root ──
export default function App() {
  const [screen, setScreen] = useState('Onboarding');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setScreen('Dashboard');
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setScreen('Onboarding');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {screen === 'Onboarding' && <OnboardingFlow onFinish={() => setScreen('Auth')} />}
      {screen === 'Auth' && <AuthScreen onLogin={() => setScreen('Dashboard')} />}
      {screen === 'Dashboard' && <DashboardScreen onSignOut={handleSignOut} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flexContainer: { flex: 1 },
  paddedContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  logoTop: { fontSize: 28, fontWeight: '900', color: COLORS.textDark, textAlign: 'center', marginVertical: 20 },
  logoSmall: { fontSize: 22, fontWeight: '900', color: COLORS.textDark },
  mainTitle: { fontSize: 32, fontWeight: '900', color: COLORS.textDark, marginBottom: 5 },
  subText: { fontSize: 16, color: COLORS.textMuted, marginBottom: 40 },
  primaryButton: { backgroundColor: COLORS.cyan, paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: COLORS.cyan, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  slide: { width, alignItems: 'center', paddingHorizontal: 30, paddingTop: 40 },
  iconContainer: { width: 120, height: 120, backgroundColor: '#FFF', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: COLORS.border },
  slideIcon: { fontSize: 50 },
  slideTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textDark, marginBottom: 15, textAlign: 'center' },
  slideDescription: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24 },
  onboardingFooter: { paddingHorizontal: 24, paddingBottom: 40 },
  paginator: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { height: 8, borderRadius: 4, backgroundColor: COLORS.cyan, marginHorizontal: 4 },
  inputGroup: { marginBottom: 30, gap: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 18, fontSize: 16, color: COLORS.textDark },
  skipButton: { marginTop: 16, padding: 10, alignItems: 'center' },
  skipText: { color: COLORS.cyan, fontSize: 14, fontWeight: '600' },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 10 },
  profilePic: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  greeting: { marginBottom: 10 },
  greetingSub: { fontSize: 16, color: COLORS.textMuted, marginBottom: 4 },
  greetingTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textDark },
  pigShadow: { position: 'absolute', bottom: 10, width: 100, height: 20, backgroundColor: 'rgba(255,182,193,0.4)', borderRadius: 50 },
  balanceCard: { backgroundColor: COLORS.glassBg, borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, elevation: 8, shadowColor: COLORS.cyan, shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, marginBottom: 30 },
  balanceLabel: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginBottom: 10 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline' },
  balanceCurrency: { fontSize: 24, fontWeight: '700', color: COLORS.textDark, marginRight: 5 },
  balanceAmount: { fontSize: 64, fontWeight: '900', color: COLORS.textDark, letterSpacing: -2 },
  balanceDecimals: { fontSize: 24, fontWeight: '700', color: COLORS.cyan },
  badge: { backgroundColor: COLORS.cyanGlow, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 15 },
  badgeText: { color: COLORS.cyan, fontSize: 12, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  linkText: { fontSize: 14, fontWeight: '700', color: COLORS.cyan },
  emptyGoals: { backgroundColor: '#FFF', borderRadius: 20, padding: 30, alignItems: 'center', gap: 10, marginBottom: 20, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyGoalsText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  goalCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  goalProgress: { fontSize: 20, fontWeight: '900', color: COLORS.cyan },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: COLORS.cyan, borderRadius: 4 },
  goalTarget: { fontSize: 12, color: COLORS.textMuted },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 12, elevation: 1 },
  txIconBg: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  txIcon: { fontSize: 20 },
  txDetails: { flex: 1 },
  txPlace: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 3 },
  txTime: { fontSize: 12, color: COLORS.textMuted },
  txSaved: { fontSize: 18, fontWeight: '900', color: COLORS.cyan },
  floatingNav: { position: 'absolute', bottom: 25, left: 24, right: 24, height: 75, backgroundColor: COLORS.glassBg, borderRadius: 40, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  navItemActive: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cyanGlow, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  navIcon: { fontSize: 20, marginBottom: 3, opacity: 0.4 },
  navIconActive: { fontSize: 20, marginBottom: 3 },
  navText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  navTextActive: { fontSize: 10, fontWeight: '800', color: COLORS.cyan },
});
