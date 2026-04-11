import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

const COLORS = { cyan: '#00B4D8', textDark: '#0F172A', textMuted: '#475569', border: '#E2E8F0', cyanGlow: 'rgba(0,180,216,0.15)' };
const emojis = ['✈️','🚗','🏠','💍','📱','🎓','👶','🏖️','🎸','⛵'];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [emoji, setEmoji] = useState('✈️');

  useEffect(() => { loadGoals(); }, []);

  async function loadGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('goals').select('*').eq('user_id', user.id);
      if (data) setGoals(data);
    }
  }

  async function addGoal() {
    if (!name || !amount) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('goals').insert({ user_id: user.id, name, target_amount: Number(amount), emoji, current_amount: 0 }).select().single();
      if (data) setGoals([...goals, data]);
    }
    setModal(false); setName(''); setAmount(''); setEmoji('✈️');
  }

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(goals.filter(g => g.id !== id));
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>היעדים שלי 🎯</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Text style={s.addBtnText}>+ חדש</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {goals.length === 0 && (
          <View style={s.empty}>
            <Text style={{fontSize:48}}>🎯</Text>
            <Text style={s.emptyText}>אין לך יעדים עדיין</Text>
            <Text style={s.emptySub}>הוסף יעד ראשון והתחל לחסוך</Text>
          </View>
        )}
        {goals.map(goal => {
          const pct = Math.min(Math.round((goal.current_amount/goal.target_amount)*100), 100);
          return (
            <View key={goal.id} style={s.goalCard}>
              <View style={s.goalTop}>
                <Text style={{fontSize:36}}>{goal.emoji}</Text>
                <View style={{flex:1, marginHorizontal:14}}>
                  <Text style={s.goalName}>{goal.name}</Text>
                  <Text style={s.goalSub}>₪{goal.current_amount} מתוך ₪{goal.target_amount?.toLocaleString()}</Text>
                </View>
                <Text style={s.goalPct}>{pct}%</Text>
              </View>
              <View style={s.bar}><View style={[s.barFill, {width: pct+'%'}]}/></View>
              {pct >= 100 && <View style={s.doneTag}><Text style={s.doneText}>🎉 הגעת ליעד!</Text></View>}
              <TouchableOpacity onPress={() => deleteGoal(goal.id)} style={s.deleteBtn}>
                <Text style={s.deleteText}>מחק</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{height:20}}/>
      </ScrollView>
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>יעד חדש ✨</Text>
            <View style={s.emojiRow}>
              {emojis.map(e => (
                <TouchableOpacity key={e} style={[s.emojiBtn, emoji===e && s.emojiBtnActive]} onPress={() => setEmoji(e)}>
                  <Text style={{fontSize:22}}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.input} placeholder="שם היעד" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} textAlign="right"/>
            <TextInput style={s.input} placeholder="סכום יעד (₪)" placeholderTextColor={COLORS.textMuted} value={amount} onChangeText={setAmount} keyboardType="numeric" textAlign="right"/>
            <TouchableOpacity style={s.saveBtn} onPress={addGoal}>
              <Text style={s.saveBtnText}>שמור יעד 🎯</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={s.cancelText}>ביטול</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F8FAFC', padding:20, paddingTop:56 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  title: { fontSize:24, fontWeight:'900', color:COLORS.textDark },
  addBtn: { backgroundColor:COLORS.cyan, paddingHorizontal:16, paddingVertical:8, borderRadius:100 },
  addBtnText: { color:'#fff', fontWeight:'700', fontSize:13 },
  empty: { alignItems:'center', padding:40, gap:10 },
  emptyText: { fontSize:18, fontWeight:'700', color:COLORS.textDark },
  emptySub: { fontSize:13, color:COLORS.textMuted, textAlign:'center' },
  goalCard: { backgroundColor:'#fff', borderRadius:20, padding:18, marginBottom:14, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10, elevation:2 },
  goalTop: { flexDirection:'row', alignItems:'center', marginBottom:12 },
  goalName: { fontSize:16, fontWeight:'700', color:COLORS.textDark },
  goalSub: { fontSize:11, color:COLORS.textMuted, marginTop:3 },
  goalPct: { fontSize:22, fontWeight:'900', color:COLORS.cyan },
  bar: { height:6, backgroundColor:'#F1F5F9', borderRadius:10, overflow:'hidden' },
  barFill: { height:'100%', backgroundColor:COLORS.cyan, borderRadius:10 },
  doneTag: { backgroundColor:COLORS.cyanGlow, borderRadius:10, padding:8, marginTop:10, alignItems:'center' },
  doneText: { color:COLORS.cyan, fontWeight:'700', fontSize:13 },
  deleteBtn: { marginTop:10, alignItems:'center' },
  deleteText: { color:'rgba(255,100,100,0.5)', fontSize:12 },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalBox: { backgroundColor:'#fff', borderRadius:28, padding:24, paddingBottom:40 },
  modalTitle: { fontSize:22, fontWeight:'900', color:COLORS.textDark, textAlign:'center', marginBottom:20 },
  emojiRow: { flexDirection:'row', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:20 },
  emojiBtn: { width:46, height:46, borderRadius:14, backgroundColor:'#F8FAFC', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'transparent' },
  emojiBtnActive: { borderColor:COLORS.cyan, backgroundColor:COLORS.cyanGlow },
  input: { backgroundColor:'#F8FAFC', borderWidth:1, borderColor:COLORS.border, borderRadius:14, padding:14, marginBottom:12, fontSize:15, color:COLORS.textDark },
  saveBtn: { backgroundColor:COLORS.cyan, padding:16, borderRadius:14, alignItems:'center', marginBottom:12 },
  saveBtnText: { color:'#fff', fontWeight:'900', fontSize:16 },
  cancelText: { color:COLORS.textMuted, textAlign:'center', fontSize:14 },
});
