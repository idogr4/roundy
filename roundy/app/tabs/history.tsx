import { View, Text, ScrollView, StyleSheet } from 'react-native';

const COLORS = { cyan: '#00B4D8', textDark: '#0F172A', textMuted: '#475569' };

const mockTransactions = [
  { id:'1', merchant:'ארומה קפה', amount:18.50, round_up:1.50, category:'קפה', date:'היום' },
  { id:'2', merchant:'וולט פיצה', amount:82.00, round_up:3.00, category:'אוכל', date:'אתמול' },
  { id:'3', merchant:'סופר-פארם', amount:54.20, round_up:0.80, category:'בריאות', date:'אתמול' },
  { id:'4', merchant:'פז תדלוק', amount:198.00, round_up:2.00, category:'תחבורה', date:'לפני יומיים' },
  { id:'5', merchant:'Spotify', amount:19.90, round_up:0.10, category:'בידור', date:'לפני יומיים' },
  { id:'6', merchant:'שופרסל', amount:234.60, round_up:0.40, category:'סופר', date:'לפני 3 ימים' },
];

const categoryEmoji = { 'קפה':'☕', 'אוכל':'🍕', 'בריאות':'💊', 'תחבורה':'⛽', 'סופר':'🛒', 'בידור':'🎬' };
const categoryColor = { 'קפה':'#FFF0E8', 'אוכל':'#F0E8FF', 'בריאות':'#E8FFF4', 'תחבורה':'#E8F4FF', 'סופר':'#FFF8E8', 'בידור':'#F8E8FF' };

export default function History() {
  const total = mockTransactions.reduce((s, t) => s + t.round_up, 0).toFixed(2);
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>היסטוריה 📋</Text>
        <View style={s.badge}><Text style={s.badgeText}>סה״כ ₪{total}</Text></View>
      </View>
      <View style={s.summaryRow}>
        <View style={s.summaryCard}><Text style={s.summaryVal}>{mockTransactions.length}</Text><Text style={s.summaryLbl}>עסקאות</Text></View>
        <View style={s.summaryCard}><Text style={s.summaryVal}>₪{total}</Text><Text style={s.summaryLbl}>עוגלו</Text></View>
        <View style={s.summaryCard}><Text style={s.summaryVal}>₪{(Number(total)/mockTransactions.length).toFixed(2)}</Text><Text style={s.summaryLbl}>ממוצע</Text></View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {mockTransactions.map(tx => (
          <View key={tx.id} style={s.txItem}>
            <View style={[s.txIcon, {backgroundColor: categoryColor[tx.category] || '#F8FAFC'}]}>
              <Text style={{fontSize:18}}>{categoryEmoji[tx.category] || '💳'}</Text>
            </View>
            <View style={{flex:1, marginHorizontal:12}}>
              <Text style={s.txName}>{tx.merchant}</Text>
              <Text style={s.txDate}>{tx.date} • ₪{tx.amount}</Text>
            </View>
            <Text style={s.txSaved}>+₪{tx.round_up}</Text>
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F8FAFC', padding:20, paddingTop:56 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  title: { fontSize:24, fontWeight:'900', color:COLORS.textDark },
  badge: { backgroundColor:'rgba(0,180,216,0.12)', paddingHorizontal:14, paddingVertical:6, borderRadius:100 },
  badgeText: { color:COLORS.cyan, fontWeight:'700', fontSize:13 },
  summaryRow: { flexDirection:'row', gap:10, marginBottom:20 },
  summaryCard: { flex:1, backgroundColor:'#fff', borderRadius:14, padding:14, alignItems:'center', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:6, elevation:1 },
  summaryVal: { fontSize:18, fontWeight:'900', color:COLORS.textDark },
  summaryLbl: { fontSize:10, color:COLORS.textMuted, marginTop:2 },
  txItem: { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:14, padding:12, marginBottom:8, shadowColor:'#000', shadowOpacity:0.03, shadowRadius:6, elevation:1 },
  txIcon: { width:40, height:40, borderRadius:13, alignItems:'center', justifyContent:'center' },
  txName: { fontSize:13, fontWeight:'600', color:COLORS.textDark },
  txDate: { fontSize:10, color:COLORS.textMuted, marginTop:2 },
  txSaved: { fontSize:15, fontWeight:'900', color:COLORS.cyan },
});
