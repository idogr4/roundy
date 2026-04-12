import "react-native-url-polyfill/auto";
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput, Animated,
  SafeAreaView, StatusBar, I18nManager, Dimensions, FlatList,
  KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import Svg, { Ellipse, Circle, Defs, RadialGradient, LinearGradient, Stop, Rect, Path, G } from 'react-native-svg';
import { supabase } from './lib/supabase';
import { calculateRoundUp, categorizeTransaction } from './lib/roundup';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width, height } = Dimensions.get('window');

const COLORS = {
  background: '#F8FAFC',
  cyan: '#00B4D8',
  cyanLight: 'rgba(0, 180, 216, 0.12)',
  textDark: '#0F172A',
  textMuted: '#475569',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  danger: '#EF4444',
  gold: '#F59E0B',
};

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'ברוכים הבאים ל-Roundy',
    desc: 'האפליקציה שהופכת כל קנייה יומיומית להזדמנות חיסכון. בלי מאמץ, בלי לחשוב, על אוטומט לגמרי.',
    sub: 'עגלנו כבר מיליוני שקלים עבור המשתמשים שלנו 🚀',
    bg: '#F0FEFF',
  },
  {
    id: '2',
    title: 'איך זה עובד?',
    desc: 'כל עסקה מתעגלת למעלה. ההפרש הקטן נצבר אצלנו. בסוף כל חודש — הכסף עובר ישירות לחיסכון שבחרת.',
    sub: 'קפה ב-18.50 ₪ → עיגול ל-20 ₪ → 1.50 ₪ לחיסכון ☕',
    bg: '#FFF8F0',
  },
  {
    id: '3',
    title: '🔒 אבטחה ברמה הגבוהה ביותר',
    desc: 'אנחנו לא רואים את הסיסמאות שלך. חיבור הבנק הוא קריאה בלבד — אין לנו גישה לבצע פעולות בחשבון.',
    sub: 'מוסדר על ידי רשות שוק ההון בישראל ✅',
    bg: '#F0FFF4',
  },
  {
    id: '4',
    title: 'משלמים, מעגלים, חוסכים.',
    desc: 'שילמת על בירה עם החברים? תרמת לחופשה בפריז. כל קנייה קטנה היא צעד אחד קרוב יותר ליעד שלך.',
    sub: 'הגיע הזמן להתחיל לחסוך — בלי להרגיש כלום 💪',
    bg: '#FFF0F8',
  },
];

const MOCK_TRANSACTIONS = [
  { id: '1', merchant: 'ארומה קפה', amount: 18.50, date: 'היום, 08:30' },
  { id: '2', merchant: 'וולט פיצה', amount: 82.00, date: 'אתמול' },
  { id: '3', merchant: 'סופר-פארם', amount: 54.20, date: 'אתמול' },
  { id: '4', merchant: 'פז תדלוק', amount: 198.00, date: 'לפני יומיים' },
];

const FUNDS = [
  { id: '1', name: 'מיטב גמל להשקעה', return1y: '12.3%', risk: 'בינוני' },
  { id: '2', name: 'הראל גמל להשקעה', return1y: '11.8%', risk: 'בינוני' },
  { id: '3', name: 'אלטשולר שחם', return1y: '14.1%', risk: 'גבוה' },
  { id: '4', name: 'מגדל גמל להשקעה', return1y: '10.9%', risk: 'נמוך' },
  { id: '5', name: 'חיסכון בבנק', return1y: '4.2%', risk: 'נמוך מאוד' },
];

// ══════════════════════════════
// HAMM PIGGY BANK SVG
// ══════════════════════════════
const HammPiggy = ({ size = 200 }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const squishAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim, { toValue: -12, duration: 1500, useNativeDriver: true }),
          Animated.timing(squishAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(squishAnim, { toValue: 0.97, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const s = size;
  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }, { scaleX: squishAnim }], alignItems: 'center' }}>
      <View style={{ shadowColor: '#FF9BB0', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}>
        <Svg height={s} width={s * 1.3} viewBox="0 0 260 200">
          <Defs>
            <RadialGradient id="bodyGrad" cx="40%" cy="35%" r="60%">
              <Stop offset="0%" stopColor="#FFD0DC" />
              <Stop offset="60%" stopColor="#FFB6C8" />
              <Stop offset="100%" stopColor="#FF8DA8" />
            </RadialGradient>
            <RadialGradient id="bellyGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <Stop offset="100%" stopColor="rgba(255,200,220,0.1)" />
            </RadialGradient>
            <RadialGradient id="earGrad" cx="40%" cy="30%" r="60%">
              <Stop offset="0%" stopColor="#FFD0DC" />
              <Stop offset="100%" stopColor="#FF8DA8" />
            </RadialGradient>
            <LinearGradient id="legGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#2D2D2D" />
              <Stop offset="100%" stopColor="#1A1A1A" />
            </LinearGradient>
          </Defs>

          {/* Shadow */}
          <Ellipse cx="120" cy="195" rx="65" ry="8" fill="rgba(0,0,0,0.08)" />

          {/* Body — fat round pig */}
          <Ellipse cx="120" cy="115" rx="72" ry="62" fill="url(#bodyGrad)" />

          {/* Belly highlight */}
          <Ellipse cx="115" cy="120" rx="40" ry="32" fill="url(#bellyGrad)" />

          {/* Left ear */}
          <Ellipse cx="68" cy="62" rx="18" ry="22" fill="url(#earGrad)" transform="rotate(-15, 68, 62)" />
          <Ellipse cx="68" cy="63" rx="10" ry="13" fill="#FF6B8A" transform="rotate(-15, 68, 63)" opacity="0.7" />

          {/* Right ear */}
          <Ellipse cx="172" cy="62" rx="18" ry="22" fill="url(#earGrad)" transform="rotate(15, 172, 62)" />
          <Ellipse cx="172" cy="63" rx="10" ry="13" fill="#FF6B8A" transform="rotate(15, 172, 63)" opacity="0.7" />

          {/* Coin slot on top */}
          <Rect x="106" y="55" width="28" height="5" rx="2.5" fill="#CC6080" />

          {/* Tail */}
          <Path d="M192 105 Q210 90 205 75 Q200 60 190 68" stroke="#FF8DA8" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* Left legs */}
          <Rect x="72" y="165" width="22" height="30" rx="11" fill="url(#legGrad)" />
          <Rect x="100" y="168" width="22" height="27" rx="11" fill="url(#legGrad)" />

          {/* Right legs */}
          <Rect x="138" y="168" width="22" height="27" rx="11" fill="url(#legGrad)" />
          <Rect x="166" y="165" width="22" height="30" rx="11" fill="url(#legGrad)" />

          {/* Snout */}
          <Ellipse cx="155" cy="128" rx="22" ry="16" fill="#FF9BB5" />
          <Ellipse cx="155" cy="128" rx="16" ry="10" fill="#FF7A9A" opacity="0.5" />
          <Circle cx="149" cy="127" r="4" fill="#CC4466" />
          <Circle cx="161" cy="127" r="4" fill="#CC4466" />

          {/* Left eye */}
          <Circle cx="93" cy="100" r="8" fill="#1A1A1A" />
          <Circle cx="96" cy="97" r="3" fill="white" />
          <Circle cx="97" cy="96" r="1.5" fill="white" />

          {/* Right eye */}
          <Circle cx="140" cy="100" r="8" fill="#1A1A1A" />
          <Circle cx="143" cy="97" r="3" fill="white" />
          <Circle cx="144" cy="96" r="1.5" fill="white" />

          {/* Cheek blush */}
          <Ellipse cx="82" cy="118" rx="12" ry="7" fill="#FF6B8A" opacity="0.3" />
          <Ellipse cx="152" cy="118" rx="12" ry="7" fill="#FF6B8A" opacity="0.3" />

          {/* Shine on body */}
          <Ellipse cx="90" cy="85" rx="18" ry="12" fill="rgba(255,255,255,0.35)" transform="rotate(-30, 90, 85)" />
        </Svg>
      </View>
    </Animated.View>
  );
};

// ══════════════════════════════
// FLOATING COINS
// ══════════════════════════════
const FloatingCoins = () => {
  const coins = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    coins.forEach((coin, i) => {
      const animate = () => {
        coin.setValue(0);
        Animated.timing(coin, {
          toValue: 1,
          duration: 2000 + i * 400,
          useNativeDriver: true,
          delay: i * 600,
        }).start(() => animate());
      };
      setTimeout(() => animate(), i * 600);
    });
  }, []);

  const positions = [
    { x: -60, y: -40 },
    { x: 60, y: -60 },
    { x: -40, y: -80 },
    { x: 50, y: -30 },
  ];

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      {coins.map((coin, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            fontSize: 20,
            opacity: coin.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: positions[i].x },
              { translateY: coin.interpolate({ inputRange: [0, 1], outputRange: [positions[i].y + 40, positions[i].y - 40] }) },
              { rotate: coin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            ],
          }}
        >
          🪙
        </Animated.Text>
      ))}
    </View>
  );
};

// ══════════════════════════════
// ONBOARDING
// ══════════════════════════════
const OnboardingScreen = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;

  return (
    <View style={styles.flexContainer}>
      <View style={styles.onboardHeader}>
        <Text style={styles.logoTop}>Roundy</Text>
        {currentIndex < ONBOARDING_SLIDES.length - 1 && (
          <TouchableOpacity onPress={onFinish}>
            <Text style={styles.skipText}>דלג</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={ONBOARDING_SLIDES} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        bounces={false} keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        ref={slidesRef}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            {index === 0 && (
              <View style={{ alignItems: 'center', marginBottom: 20, position: 'relative' }}>
                <HammPiggy size={180} />
                <FloatingCoins />
              </View>
            )}
            {index !== 0 && (
              <View style={styles.onboardIconBg}>
                <Text style={{ fontSize: 56 }}>{item.id === '2' ? '☕' : item.id === '3' ? '🔒' : '🎯'}</Text>
              </View>
            )}
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDesc}>{item.desc}</Text>
            <View style={styles.subBadge}>
              <Text style={styles.subBadgeText}>{item.sub}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.onboardFooter}>
        <View style={styles.paginator}>
          {ONBOARDING_SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i-1)*width, i*width, (i+1)*width],
              outputRange: [8, 24, 8], extrapolate: 'clamp'
            });
            const opacity = scrollX.interpolate({
              inputRange: [(i-1)*width, i*width, (i+1)*width],
              outputRange: [0.3, 1, 0.3], extrapolate: 'clamp'
            });
            return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />;
          })}
        </View>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={currentIndex === ONBOARDING_SLIDES.length - 1 ? onFinish : () => slidesRef.current.scrollToIndex({ index: currentIndex + 1 })}
        >
          <Text style={styles.btnPrimaryText}>
            {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'מתחילים לחסוך! 🚀' : 'המשך'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ══════════════════════════════
// AUTH
// ══════════════════════════════
const AuthScreen = ({ onLogin }) => {
  const [step, setStep] = useState('register'); // register, fund, roundup, goal
  const [loading, setLoading] = useState(false);

  // Register fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');

  // Fund selection
  const [selectedFund, setSelectedFund] = useState(null);

  // Round up
  const [roundUp, setRoundUp] = useState(10);

  // Goal
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('✈️');
  const [userId, setUserId] = useState(null);

  const goalEmojis = ['✈️','🚗','🏠','💍','📱','🎓','🏖️','👶'];

  async function handleRegister() {
    if (!fullName || !email || !password) { Alert.alert('שגיאה', 'שם, אימייל וסיסמה הם שדות חובה'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { Alert.alert('שגיאה', error.message); setLoading(false); return; }
    if (data.user) {
      setUserId(data.user.id);
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        phone,
        birth_date: birthDate,
        id_number: idNumber,
        address,
        round_up_amount: 10,
      });
      setStep('fund');
    }
    setLoading(false);
  }

  async function handleFundSelect(fund) {
    setSelectedFund(fund);
    if (userId) {
      await supabase.from('profiles').update({
        savings_fund_name: fund.name,
        savings_fund_id: fund.id,
      }).eq('id', userId);
    }
    setStep('roundup');
  }

  async function handleRoundUp() {
    if (userId) {
      await supabase.from('profiles').update({ round_up_amount: roundUp }).eq('id', userId);
    }
    setStep('goal');
  }

  async function handleGoal() {
    if (goalName && goalAmount && userId) {
      await supabase.from('goals').insert({
        user_id: userId,
        name: goalName,
        target_amount: Number(goalAmount),
        emoji: goalEmoji,
        current_amount: 0,
      });
    }
    onLogin();
  }

  // Register step
  if (step === 'register') return (
    <KeyboardAvoidingView style={styles.flexContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.paddedContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.logoTop}>Roundy</Text>
        <Text style={styles.stepTitle}>יצירת חשבון</Text>
        <Text style={styles.stepDesc}>מלא את הפרטים כדי להתחיל לחסוך</Text>

        <View style={styles.progressRow}>
          {['👤','🏦','⚙️','🎯'].map((icon, i) => (
            <View key={i} style={[styles.progressStep, i === 0 && styles.progressStepActive]}>
              <Text style={{ fontSize: 16 }}>{icon}</Text>
            </View>
          ))}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>שם מלא *</Text>
          <TextInput style={styles.input} placeholder="ישראל ישראלי" value={fullName} onChangeText={setFullName} textAlign="right" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>אימייל *</Text>
          <TextInput style={styles.input} placeholder="israel@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textAlign="right" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>סיסמה *</Text>
          <TextInput style={styles.input} placeholder="לפחות 8 תווים" value={password} onChangeText={setPassword} secureTextEntry textAlign="right" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>מספר טלפון</Text>
          <TextInput style={styles.input} placeholder="050-0000000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>תאריך לידה</Text>
          <TextInput style={styles.input} placeholder="DD/MM/YYYY" value={birthDate} onChangeText={setBirthDate} textAlign="right" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>תעודת זהות</Text>
          <TextInput style={styles.input} placeholder="נדרש לקרן גמל" value={idNumber} onChangeText={setIdNumber} keyboardType="numeric" textAlign="right" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>כתובת מגורים</Text>
          <TextInput style={styles.input} placeholder="רחוב, עיר" value={address} onChangeText={setAddress} textAlign="right" />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnPrimaryText}>{loading ? 'נרשם...' : 'המשך ←'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={() => { setStep('login'); }}>
          <Text style={styles.linkText}>יש לי חשבון — התחבר</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Login step
  if (step === 'login') return (
    <KeyboardAvoidingView style={styles.flexContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.paddedContainer}>
        <Text style={styles.logoTop}>Roundy</Text>
        <Text style={styles.stepTitle}>ברוך הבא בחזרה</Text>
        <Text style={styles.stepDesc}>התחבר לחשבון שלך</Text>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>אימייל</Text>
          <TextInput style={styles.input} placeholder="israel@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textAlign="right" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>סיסמה</Text>
          <TextInput style={styles.input} placeholder="סיסמה" value={password} onChangeText={setPassword} secureTextEntry textAlign="right" />
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={async () => {
          setLoading(true);
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) { Alert.alert('שגיאה', 'אימייל או סיסמה שגויים'); setLoading(false); return; }
          onLogin();
          setLoading(false);
        }} disabled={loading}>
          <Text style={styles.btnPrimaryText}>{loading ? 'מתחבר...' : 'כניסה'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={() => setStep('register')}>
          <Text style={styles.linkText}>אין לי חשבון — הרשמה</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Fund selection step
  if (step === 'fund') return (
    <ScrollView contentContainerStyle={styles.paddedContainer}>
      <Text style={styles.logoTop}>Roundy</Text>
      <View style={styles.progressRow}>
        {['👤','🏦','⚙️','🎯'].map((icon, i) => (
          <View key={i} style={[styles.progressStep, i === 1 && styles.progressStepActive]}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.stepTitle}>לאן הכסף ילך?</Text>
      <Text style={styles.stepDesc}>בחר איפה תרצה שהחיסכון שלך יושקע</Text>

      {FUNDS.map(fund => (
        <TouchableOpacity key={fund.id} style={[styles.fundCard, selectedFund?.id === fund.id && styles.fundCardActive]} onPress={() => handleFundSelect(fund)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fundName}>{fund.name}</Text>
            <Text style={styles.fundReturn}>תשואה שנתית: {fund.return1y}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: fund.risk === 'גבוה' ? '#FEE2E2' : fund.risk === 'נמוך מאוד' ? '#DCFCE7' : '#FEF9C3' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: fund.risk === 'גבוה' ? '#DC2626' : fund.risk === 'נמוך מאוד' ? '#16A34A' : '#CA8A04' }}>{fund.risk}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.btnSecondary, { marginTop: 10 }]} onPress={() => setStep('roundup')}>
        <Text style={styles.linkText}>דלג — אחבר אחר כך</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Round up step
  if (step === 'roundup') return (
    <View style={styles.paddedContainer}>
      <Text style={styles.logoTop}>Roundy</Text>
      <View style={styles.progressRow}>
        {['👤','🏦','⚙️','🎯'].map((icon, i) => (
          <View key={i} style={[styles.progressStep, i === 2 && styles.progressStepActive]}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.stepTitle}>איך לעגל?</Text>
      <Text style={styles.stepDesc}>כשתקנה ב-12 ₪ — לאיזה סכום לעגל?</Text>

      {[5, 10].map(amt => (
        <TouchableOpacity key={amt} style={[styles.optionCard, roundUp === amt && styles.optionCardActive]} onPress={() => setRoundUp(amt)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>עיגול ל-{amt} ₪ הקרובים</Text>
            <Text style={styles.optionDesc}>קנייה ב-12 ₪ → חיסכון של {amt === 5 ? '3' : '8'} ₪</Text>
          </View>
          {roundUp === amt && <Text style={{ color: COLORS.cyan, fontSize: 22 }}>✓</Text>}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.btnPrimary, { marginTop: 24 }]} onPress={handleRoundUp}>
        <Text style={styles.btnPrimaryText}>המשך ←</Text>
      </TouchableOpacity>
    </View>
  );

  // Goal step
  if (step === 'goal') return (
    <KeyboardAvoidingView style={styles.flexContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.paddedContainer}>
        <Text style={styles.logoTop}>Roundy</Text>
        <View style={styles.progressRow}>
          {['👤','🏦','⚙️','🎯'].map((icon, i) => (
            <View key={i} style={[styles.progressStep, i === 3 && styles.progressStepActive]}>
              <Text style={{ fontSize: 16 }}>{icon}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.stepTitle}>מה החלום שלך?</Text>
        <Text style={styles.stepDesc}>הגדר יעד ראשון — לאן הכסף הולך?</Text>

        <View style={styles.emojiRow}>
          {goalEmojis.map(e => (
            <TouchableOpacity key={e} style={[styles.emojiBtn, goalEmoji === e && styles.emojiBtnActive]} onPress={() => setGoalEmoji(e)}>
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>שם היעד</Text>
          <TextInput style={styles.input} placeholder="חופשה בפריז, רכב חדש..." value={goalName} onChangeText={setGoalName} textAlign="right" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>סכום יעד (₪)</Text>
          <TextInput style={styles.input} placeholder="3000" keyboardType="numeric" value={goalAmount} onChangeText={setGoalAmount} textAlign="right" />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleGoal}>
          <Text style={styles.btnPrimaryText}>בואו נחסוך! 🚀</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignItems: 'center', marginTop: 14 }} onPress={onLogin}>
          <Text style={styles.linkText}>דלג — אוסיף יעד אחר כך</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return null;
};

// ══════════════════════════════
// HOME SCREEN
// ══════════════════════════════
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
      data={[{ key: 'c' }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={() => (
        <View>
          <View style={styles.header}>
            <Text style={styles.logoSmall}>Roundy</Text>
            <TouchableOpacity style={styles.avatar} onPress={onSignOut}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={styles.greeting}>שלום, {userName} 👋</Text>

            <View style={{ alignItems: 'center', marginVertical: 16, position: 'relative' }}>
              <HammPiggy size={200} />
              <FloatingCoins />
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>נצבר החודש לקופה</Text>
              <Text style={styles.balanceAmount}>
                ₪{Math.floor(totalSaved)}<Text style={styles.balanceDecimals}>.{String(totalSaved.toFixed(2)).split('.')[1]}</Text>
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✨ מ-{MOCK_TRANSACTIONS.length} עסקאות שעוגלו</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>היעדים שלי</Text>
            {goals.length === 0 ? (
              <View style={[styles.emptyCard]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
                <Text style={styles.emptyText}>עבור ליעדים כדי להוסיף יעד ראשון</Text>
              </View>
            ) : goals.map(goal => {
              const pct = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <Text style={{ fontSize: 28 }}>{goal.emoji}</Text>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.goalTitle}>{goal.name}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: pct + '%' }]} />
                    </View>
                  </View>
                  <Text style={styles.goalPct}>{pct}%</Text>
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>עיגולים אחרונים</Text>
            {txWithRoundups.map(tx => (
              <View key={tx.id} style={styles.txCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txName}>{tx.merchant}</Text>
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

// ══════════════════════════════
// GOALS SCREEN
// ══════════════════════════════
const GoalsScreen = () => {
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [emoji, setEmoji] = useState('✈️');
  const emojis = ['✈️','🚗','🏠','💍','📱','🎓','🏖️','👶'];

  useEffect(() => { loadGoals(); }, []);

  async function loadGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('goals').select('*').eq('user_id', user.id);
      if (data) setGoals(data);
    }
  }

  async function addGoal() {
    if (!name || !amount) { Alert.alert('שגיאה', 'יש למלא את כל השדות'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('goals').insert({ user_id: user.id, name, target_amount: Number(amount), emoji, current_amount: 0 }).select().single();
      if (data) setGoals(prev => [...prev, data]);
    }
    setName(''); setAmount('');
  }

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  return (
    <FlatList
      data={goals}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 24, paddingBottom: 20 }}
      ListHeaderComponent={() => (
        <View>
          <Text style={styles.pageTitle}>היעדים שלי 🎯</Text>
          <View style={styles.addCard}>
            <View style={styles.emojiRow}>
              {emojis.map(e => (
                <TouchableOpacity key={e} style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]} onPress={() => setEmoji(e)}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="שם היעד" value={name} onChangeText={setName} textAlign="right" />
            <TextInput style={styles.input} placeholder="סכום יעד (₪)" keyboardType="numeric" value={amount} onChangeText={setAmount} textAlign="right" />
            <TouchableOpacity style={styles.btnPrimary} onPress={addGoal}>
              <Text style={styles.btnPrimaryText}>+ הוסף יעד</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      renderItem={({ item }) => {
        const pct = Math.min(Math.round((item.current_amount / item.target_amount) * 100), 100);
        return (
          <View style={styles.goalItemFull}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.goalTitle}>{item.name}</Text>
                <Text style={styles.goalPct}>{pct}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: pct + '%' }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={styles.txDate}>₪{item.current_amount} נצבר</Text>
                <Text style={styles.txDate}>יעד: ₪{item.target_amount?.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteGoal(item.id)} style={styles.deleteBtn}>
              <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: '700' }}>מחק</Text>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
};

// ══════════════════════════════
// HISTORY SCREEN
// ══════════════════════════════
const HistoryScreen = () => {
  const [roundUpAmount] = useState(10);
  const txWithRoundups = MOCK_TRANSACTIONS.map(tx => ({
    ...tx, round_up: calculateRoundUp(tx.amount, roundUpAmount),
  }));
  const total = txWithRoundups.reduce((s, t) => s + t.round_up, 0).toFixed(2);

  return (
    <FlatList
      data={txWithRoundups}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 24, paddingBottom: 20 }}
      ListHeaderComponent={() => (
        <View>
          <Text style={styles.pageTitle}>היסטוריה 📋</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.balanceLabel}>סה״כ עוגל החודש</Text>
            <Text style={[styles.balanceAmount, { color: COLORS.cyan }]}>₪{total}</Text>
          </View>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.txCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txName}>{item.merchant}</Text>
            <Text style={styles.txDate}>{item.date} | ₪{item.amount}</Text>
          </View>
          <Text style={styles.txSaved}>+₪{item.round_up}</Text>
        </View>
      )}
    />
  );
};

// ══════════════════════════════
// SETTINGS SCREEN
// ══════════════════════════════
const SettingsScreen = ({ onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [roundUp, setRoundUp] = useState(10);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [funds] = useState(FUNDS);
  const [selectedFund, setSelectedFund] = useState(null);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setRoundUp(data.round_up_amount || 10);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setSelectedFund(data.savings_fund_name);
      }
    }
  }

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id);
      setEditing(false);
      Alert.alert('✅ נשמר', 'הפרטים עודכנו בהצלחה');
    }
  }

  async function updateRoundUp(amount) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ round_up_amount: amount }).eq('id', user.id);
      setRoundUp(amount);
    }
  }

  async function updateFund(fund) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ savings_fund_name: fund.name, savings_fund_id: fund.id }).eq('id', user.id);
      setSelectedFund(fund.name);
      Alert.alert('✅ עודכן', `קרן החיסכון שונתה ל-${fund.name}`);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>הגדרות ⚙️</Text>

      {/* Profile */}
      <Text style={styles.sectionTitle}>פרופיל אישי</Text>
      <View style={styles.settingsCard}>
        {editing ? (
          <View>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="שם מלא" textAlign="right" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="טלפון" keyboardType="phone-pad" textAlign="right" />
            <TouchableOpacity style={styles.btnPrimary} onPress={saveProfile}>
              <Text style={styles.btnPrimaryText}>שמור</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>שם</Text>
              <Text style={styles.settingsValue}>{profile?.full_name || '—'}</Text>
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>טלפון</Text>
              <Text style={styles.settingsValue}>{profile?.phone || '—'}</Text>
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>תעודת זהות</Text>
              <Text style={styles.settingsValue}>{profile?.id_number ? '***' + profile.id_number.slice(-3) : '—'}</Text>
            </View>
            <TouchableOpacity style={[styles.btnSecondary, { marginTop: 10 }]} onPress={() => setEditing(true)}>
              <Text style={styles.linkText}>✏️ ערוך פרטים</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Round up */}
      <Text style={styles.sectionTitle}>הגדרות עיגול</Text>
      {[5, 10].map(amt => (
        <TouchableOpacity key={amt} style={[styles.optionCard, roundUp === amt && styles.optionCardActive]} onPress={() => updateRoundUp(amt)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>עיגול ל-{amt} ₪</Text>
            <Text style={styles.optionDesc}>קנייה ב-12 ₪ → חיסכון של {amt === 5 ? 3 : 8} ₪</Text>
          </View>
          {roundUp === amt && <Text style={{ color: COLORS.cyan, fontSize: 20 }}>✓</Text>}
        </TouchableOpacity>
      ))}

      {/* Fund */}
      <Text style={styles.sectionTitle}>קרן חיסכון</Text>
      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>קרן נוכחית: <Text style={{ color: COLORS.cyan, fontWeight: '700' }}>{selectedFund || 'לא הוגדרה'}</Text></Text>
      </View>
      {funds.map(fund => (
        <TouchableOpacity key={fund.id} style={[styles.fundCard, selectedFund === fund.name && styles.fundCardActive]} onPress={() => updateFund(fund)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fundName}>{fund.name}</Text>
            <Text style={styles.fundReturn}>תשואה: {fund.return1y}</Text>
          </View>
          {selectedFund === fund.name && <Text style={{ color: COLORS.cyan, fontSize: 20 }}>✓</Text>}
        </TouchableOpacity>
      ))}

      {/* Bank */}
      <Text style={styles.sectionTitle}>חיבור בנק</Text>
      <TouchableOpacity style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>🏦 חבר את הבנק שלי</Text>
        <Text style={styles.txDate}>מאובטח דרך Bridger</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: COLORS.danger, marginTop: 30 }]} onPress={onLogout}>
        <Text style={styles.btnPrimaryText}>התנתק</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ══════════════════════════════
// BOTTOM NAV
// ══════════════════════════════
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
          <Text style={[styles.navLabel, current === tab.id && { color: COLORS.cyan, fontWeight: '800' }]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ══════════════════════════════
// ROOT APP
// ══════════════════════════════
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

// ══════════════════════════════
// STYLES
// ══════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flexContainer: { flex: 1, backgroundColor: COLORS.background },
  paddedContainer: { padding: 24, paddingTop: 20, flexGrow: 1 },

  // Onboarding
  onboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 },
  logoTop: { fontSize: 26, fontWeight: '900', color: COLORS.textDark, textAlign: 'center', paddingVertical: 10 },
  skipText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  slide: { width, padding: 30, paddingTop: 20, alignItems: 'center', justifyContent: 'center', flex: 1 },
  onboardIconBg: { width: 110, height: 110, backgroundColor: COLORS.cardBg, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 28, elevation: 6, shadowColor: COLORS.cyan, shadowOpacity: 0.15, shadowRadius: 20 },
  slideTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textDark, textAlign: 'center', marginBottom: 14, lineHeight: 34 },
  slideDesc: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  subBadge: { backgroundColor: COLORS.cyanLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginTop: 8 },
  subBadgeText: { color: COLORS.cyan, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  onboardFooter: { padding: 24, paddingBottom: 32 },
  paginator: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  dot: { height: 8, borderRadius: 4, backgroundColor: COLORS.cyan, marginHorizontal: 4 },

  // Auth
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  progressStep: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  progressStepActive: { borderColor: COLORS.cyan, backgroundColor: COLORS.cyanLight },
  stepTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textDark, marginBottom: 6 },
  stepDesc: { fontSize: 15, color: COLORS.textMuted, marginBottom: 24, lineHeight: 22 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
  input: { backgroundColor: COLORS.cardBg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, fontSize: 15, color: COLORS.textDark },
  fundCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, elevation: 1 },
  fundCardActive: { borderColor: COLORS.cyan, backgroundColor: COLORS.cyanLight },
  fundName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  fundReturn: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  optionCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, elevation: 1 },
  optionCardActive: { borderColor: COLORS.cyan, backgroundColor: COLORS.cyanLight },
  optionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  optionDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' },
  emojiBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  emojiBtnActive: { borderColor: COLORS.cyan, backgroundColor: COLORS.cyanLight },
  linkText: { color: COLORS.cyan, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  btnPrimary: { backgroundColor: COLORS.cyan, padding: 17, borderRadius: 16, alignItems: 'center', marginTop: 6, shadowColor: COLORS.cyan, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  btnPrimaryText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  btnSecondary: { alignItems: 'center', padding: 12 },

  // Home
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 8 },
  logoSmall: { fontSize: 22, fontWeight: '900', color: COLORS.textDark },
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  greeting: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, marginBottom: 4 },
  balanceCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 5, shadowColor: COLORS.cyan, shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, marginBottom: 24 },
  balanceLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 },
  balanceAmount: { fontSize: 52, fontWeight: '900', color: COLORS.textDark, letterSpacing: -2 },
  balanceDecimals: { fontSize: 26, color: COLORS.cyan, fontWeight: '700' },
  badge: { backgroundColor: COLORS.cyanLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 10 },
  badgeText: { color: COLORS.cyan, fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark, marginBottom: 12, marginTop: 8 },
  goalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  goalTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  goalPct: { fontSize: 18, fontWeight: '900', color: COLORS.cyan },
  progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', backgroundColor: COLORS.cyan, borderRadius: 3 },
  emptyCard: { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6 },
  txName: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  txDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  txSaved: { fontSize: 17, fontWeight: '900', color: COLORS.cyan },

  // Goals
  pageTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textDark, marginBottom: 16 },
  addCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  goalItemFull: { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8, marginTop: 10, alignSelf: 'flex-start' },

  // Settings
  settingsCard: { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 18, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingsLabel: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  settingsValue: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  summaryCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16, elevation: 3 },

  // Bottom Nav
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.cardBg, paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: COLORS.border, justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 28 : 12 },
  navItem: { alignItems: 'center', flex: 1, paddingVertical: 4 },
  navItemActive: { backgroundColor: COLORS.cyanLight, borderRadius: 14 },
  navLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 3, fontWeight: '600' },
});
