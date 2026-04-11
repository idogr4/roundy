import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const emojis = ['✈️','🚗','🏠','💍','📱','🎓','👶','🏖️','🎸','⛵'];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [funds, setFunds] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [roundUp, setRoundUp] = useState(10);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('✈️');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('funds').select('*').then(({ data }) => {
      if (data) setFunds(data);
    });
  }, []);

  async function finish() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        savings_fund_id: selectedFund?.id,
        savings_fund_name: selectedFund?.name,
        round_up_amount: roundUp,
        bank_connected: false,
      }).eq('id', user.id);

      if (goalName && goalAmount) {
        await supabase.from('goals').insert({
          user_id: user.id,
          name: goalName,
          target_amount: Number(goalAmount),
          emoji: goalEmoji,
        });
      }
    }
    setLoading(false);
    router.replace('/tabs/home');
  }

  function next() {
    if (step < 4) setStep(step + 1);
    else finish();
  }

  const riskColor = { 'נמוך':'#38d4c0', 'בינוני':'#48c8e8', 'גבוה':'#ff9a6c' };

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {[1,2,3,4].map(i => (
          <View key={i} style={[styles.dot, step >= i && styles.dotActive, step >= i && {width: 24}]}/>
        ))}
      </View>

      <ScrollView contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>

        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>🏦</Text>
            <Text style={styles.title}>לאן הכסף ילך?</Text>
            <Text style={styles.sub}>בחר איפה תרצה לחסוך. נעביר אוטומטית בסוף כל חודש.</Text>
            {funds.map(fund => (
              <TouchableOpacity key={fund.id} style={[styles.fundCard, selectedFund?.id === fund.id && styles.fundCardActive]} onPress={() => setSelectedFund(fund)}>
                <View style={styles.fundTop}>
                  <Text style={styles.fundName}>{fund.name}</Text>
                  <View style={[styles.riskBadge, {backgroundColor: riskColor[fund.risk_level] + '22'}]}>
                    <Text style={[styles.riskText, {color: riskColor[fund.risk_level]}]}>{fund.risk_level}</Text>
                  </View>
                </View>
                <Text style={styles.fundDesc}>{fund.description}</Text>
                <View style={styles.returnsRow}>
                  <View style={styles.returnItem}>
                    <Text style={styles.returnVal}>{fund.return_1y}%</Text>
                    <Text style={styles.returnLbl}>שנה</Text>
                  </View>
                  <View style={styles.returnItem}>
                    <Text style={styles.returnVal}>{fund.return_3y}%</Text>
                    <Text style={styles.returnLbl}>3 שנים</Text>
                  </View>
                  <View style={styles.returnItem}>
                    <Text style={styles.returnVal}>{fund.return_5y}%</Text>
                    <Text style={styles.returnLbl}>5 שנים</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>⚙️</Text>
            <Text style={styles.title}>איך לעגל?</Text>
            <Text style={styles.sub}>כשתקנה ב-12 ₪ — לאיזה סכום לעגל?</Text>
            {[5, 10].map(amt => (
              <TouchableOpacity key={amt} style={[styles.optionCard, roundUp === amt && styles.optionCardActive]} onPress={() => setRoundUp(amt)}>
                <View>
                  <Text style={styles.optionTitle}>עיגול ל-{amt} ₪ הקרובים</Text>
                  <Text style={styles.optionExample}>קנייה ב-12 ₪ → עיגול ל-{amt === 5 ? 15 : 20} ₪ = חיסכון של {amt === 5 ? 3 : 8} ₪</Text>
                </View>
                {roundUp === amt && <Text style={{color:'#48c8e8', fontSize:20}}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>🏦</Text>
            <Text style={styles.title}>חיבור לבנק</Text>
            <Text style={styles.sub}>נקרא את העסקאות שלך כדי לחשב עיגולים. אנחנו רק קוראים — לא נוגעים בכסף.</Text>
            <TouchableOpacity style={styles.bankBtn}>
              <Text style={styles.bankBtnText}>🔗 חבר את הבנק שלי</Text>
            </TouchableOpacity>
            <Text style={styles.bankNote}>מאובטח לחלוטין דרך Bridger</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>🔒 אנחנו רק קוראים עסקאות. אין לנו גישה להעביר כסף מהבנק ללא אישורך המפורש בכל פעם.</Text>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.title}>מה החלום שלך?</Text>
            <Text style={styles.sub}>הגדר יעד ראשון — זה מה שיניע אותך לחסוך כל יום</Text>
            <View style={styles.emojiRow}>
              {emojis.map(e => (
                <TouchableOpacity key={e} style={[styles.emojiBtn, goalEmoji === e && styles.emojiBtnActive]} onPress={() => setGoalEmoji(e)}>
                  <Text style={{fontSize:22}}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="שם היעד (למשל: חופשה בפריז)" placeholderTextColor="#9ac0d0" value={goalName} onChangeText={setGoalName} textAlign="right"/>
            <TextInput style={styles.input} placeholder="סכום יעד (₪)" placeholderTextColor="#9ac0d0" value={goalAmount} onChangeText={setGoalAmount} keyboardType="numeric" textAlign="right"/>
          </View>
        )}

      </ScrollView>

      <TouchableOpacity style={[styles.nextBtn, loading && {opacity:0.6}]} onPress={next} disabled={loading}>
        <Text style={styles.nextBtnText}>{loading ? 'שומר...' : step === 4 ? 'בואו נתחיל! 🚀' : 'המשך →'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0f2040', padding:20, paddingTop:56 },
  progressRow: { flexDirection:'row', gap:8, justifyContent:'center', marginBottom:28 },
  dot: { width:8, height:8, borderRadius:4, backgroundColor:'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor:'#48c8e8' },
  step: { paddingBottom:20 },
  stepEmoji: { fontSize:52, textAlign:'center', marginBottom:12 },
  title: { fontSize:26, fontWeight:'900', color:'#fff', textAlign:'center', marginBottom:8, letterSpacing:-0.5 },
  sub: { fontSize:13, color:'rgba(255,255,255,0.45)', textAlign:'center', marginBottom:24, lineHeight:20 },
  fundCard: { backgroundColor:'#1a3a5c', borderRadius:18, padding:16, marginBottom:12, borderWidth:1.5, borderColor:'transparent' },
  fundCardActive: { borderColor:'#48c8e8', backgroundColor:'rgba(72,200,232,0.08)' },
  fundTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  fundName: { fontSize:15, fontWeight:'700', color:'#fff', flex:1 },
  riskBadge: { paddingHorizontal:10, paddingVertical:4, borderRadius:100 },
  riskText: { fontSize:11, fontWeight:'600' },
  fundDesc: { fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:12, lineHeight:16 },
  returnsRow: { flexDirection:'row', gap:16 },
  returnItem: { alignItems:'center' },
  returnVal: { fontSize:16, fontWeight:'900', color:'#48c8e8' },
  returnLbl: { fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 },
  optionCard: { backgroundColor:'#1a3a5c', borderRadius:18, padding:18, marginBottom:12, borderWidth:1.5, borderColor:'transparent', flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  optionCardActive: { borderColor:'#48c8e8', backgroundColor:'rgba(72,200,232,0.08)' },
  optionTitle: { fontSize:15, fontWeight:'700', color:'#fff', marginBottom:4 },
  optionExample: { fontSize:12, color:'rgba(255,255,255,0.4)' },
  bankBtn: { backgroundColor:'#1a3a5c', borderWidth:1.5, borderColor:'#48c8e8', padding:18, borderRadius:16, alignItems:'center', marginBottom:12 },
  bankBtnText: { color:'#48c8e8', fontWeight:'700', fontSize:16 },
  bankNote: { fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', marginBottom:16 },
  infoBox: { backgroundColor:'rgba(72,200,232,0.06)', borderRadius:14, padding:14, borderWidth:1, borderColor:'rgba(72,200,232,0.12)' },
  infoText: { fontSize:11, color:'rgba(255,255,255,0.4)', textAlign:'center', lineHeight:18 },
  emojiRow: { flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center', marginBottom:20 },
  emojiBtn: { width:50, height:50, borderRadius:16, backgroundColor:'#1a3a5c', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'transparent' },
  emojiBtnActive: { borderColor:'#48c8e8', backgroundColor:'rgba(72,200,232,0.1)' },
  input: { backgroundColor:'#1a3a5c', color:'#fff', padding:16, borderRadius:14, marginBottom:12, fontSize:15, borderWidth:1, borderColor:'rgba(72,200,232,0.15)' },
  nextBtn: { backgroundColor:'#48c8e8', padding:18, borderRadius:16, alignItems:'center', marginTop:12 },
  nextBtnText: { color:'#fff', fontWeight:'900', fontSize:17 },
});
