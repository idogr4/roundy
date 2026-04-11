import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { supabase } from '../../lib/supabase';

const COLORS = { cyan: '#00B4D8', textDark: '#0F172A', textMuted: '#475569', border: '#E2E8F0', cyanGlow: 'rgba(0,180,216,0.15)' };

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    }
  }

  async function updateRoundUp(amount) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ round_up_amount: amount }).eq('id', user.id);
      setProfile({...profile, round_up_amount: amount});
    }
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>הגדרות ⚙️</Text>

      <Text style={s.sectionLabel}>פרופיל</Text>
      <View style={s.profileCard}>
        <View style={s.avatar}><Text style={{fontSize:32}}>🧑</Text></View>
        <View style={{flex:1, marginRight:14}}>
          <Text style={s.profileName}>{profile?.full_name || 'המשתמש שלי'}</Text>
          <Text style={s.profileSub}>חוסך עם Roundy 🐷</Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>הגדרות עיגול</Text>
      {[5, 10].map(amt => (
        <TouchableOpacity key={amt} style={[s.optionRow, profile?.round_up_amount === amt && s.optionRowActive]} onPress={() => updateRoundUp(amt)}>
          <View>
            <Text style={s.optionTitle}>עיגול ל-{amt} ₪ הקרובים</Text>
            <Text style={s.optionSub}>קנייה ב-12 ₪ → חיסכון של {amt === 5 ? 3 : 8} ₪</Text>
          </View>
          {profile?.round_up_amount === amt && <Text style={{color:COLORS.cyan, fontSize:18}}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={s.sectionLabel}>יעד חיסכון</Text>
      <View style={s.infoRow}>
        <Text style={s.infoLabel}>קרן נוכחית</Text>
        <Text style={s.infoValue}>{profile?.savings_fund_name || 'לא הוגדר'}</Text>
      </View>

      <Text style={s.sectionLabel}>התראות</Text>
      <View style={s.switchRow}>
        <Text style={s.switchLabel}>התראה כשמגיעים ליעד</Text>
        <Switch value={notifications} onValueChange={setNotifications} trackColor={{true:COLORS.cyan}}/>
      </View>

      <View style={{height:40}}/>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F8FAFC', padding:20, paddingTop:56 },
  title: { fontSize:24, fontWeight:'900', color:COLORS.textDark, marginBottom:24 },
  sectionLabel: { fontSize:11, fontWeight:'700', color:COLORS.textMuted, letterSpacing:1, textTransform:'uppercase', marginBottom:10, marginTop:10 },
  profileCard: { backgroundColor:'#fff', borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', marginBottom:20, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, elevation:2 },
  avatar: { width:56, height:56, borderRadius:28, backgroundColor:'#F8FAFC', alignItems:'center', justifyContent:'center', marginLeft:14 },
  profileName: { fontSize:17, fontWeight:'700', color:COLORS.textDark },
  profileSub: { fontSize:12, color:COLORS.textMuted, marginTop:2 },
  optionRow: { backgroundColor:'#fff', borderRadius:14, padding:16, marginBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1.5, borderColor:'transparent', shadowColor:'#000', shadowOpacity:0.03, elevation:1 },
  optionRowActive: { borderColor:COLORS.cyan, backgroundColor:COLORS.cyanGlow },
  optionTitle: { fontSize:14, fontWeight:'600', color:COLORS.textDark },
  optionSub: { fontSize:11, color:COLORS.textMuted, marginTop:2 },
  infoRow: { backgroundColor:'#fff', borderRadius:14, padding:16, flexDirection:'row', justifyContent:'space-between', marginBottom:8, shadowColor:'#000', shadowOpacity:0.03, elevation:1 },
  infoLabel: { fontSize:14, color:COLORS.textDark, fontWeight:'500' },
  infoValue: { fontSize:14, fontWeight:'600', color:COLORS.cyan },
  switchRow: { backgroundColor:'#fff', borderRadius:14, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', shadowColor:'#000', shadowOpacity:0.03, elevation:1 },
  switchLabel: { fontSize:14, color:COLORS.textDark, fontWeight:'500' },
});
