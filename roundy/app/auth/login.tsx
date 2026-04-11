import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAuth() {
    setLoading(true);
    setError('');
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName });
        router.replace('/auth/onboarding');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError('אימייל או סיסמה שגויים'); setLoading(false); return; }
      router.replace('/tabs/home');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>🐷</Text>
        <Text style={styles.appName}>Roundy</Text>
        <Text style={styles.tagline}>חוסך בלי להרגיש</Text>
      </View>

      <View style={styles.form}>
        {isSignUp && (
          <TextInput style={styles.input} placeholder="שם מלא" placeholderTextColor="#9ac0d0" value={fullName} onChangeText={setFullName} textAlign="right"/>
        )}
        <TextInput style={styles.input} placeholder="אימייל" placeholderTextColor="#9ac0d0" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textAlign="right"/>
        <TextInput style={styles.input} placeholder="סיסמה" placeholderTextColor="#9ac0d0" value={password} onChangeText={setPassword} secureTextEntry textAlign="right"/>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'טוען...' : isSignUp ? 'הרשמה' : 'כניסה'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? 'יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0f2040', justifyContent:'center', padding:24 },
  logoWrap: { alignItems:'center', marginBottom:40 },
  logo: { fontSize:64, marginBottom:8 },
  appName: { fontSize:42, fontWeight:'900', color:'#fff', letterSpacing:-1 },
  tagline: { fontSize:14, color:'rgba(255,255,255,0.4)', marginTop:4 },
  form: { gap:12 },
  input: { backgroundColor:'#1a3a5c', color:'#fff', padding:16, borderRadius:14, fontSize:15, borderWidth:1, borderColor:'rgba(72,200,232,0.15)' },
  btn: { backgroundColor:'#48c8e8', padding:16, borderRadius:14, alignItems:'center', marginTop:8 },
  btnText: { color:'#fff', fontWeight:'900', fontSize:16 },
  switchText: { color:'#48c8e8', textAlign:'center', marginTop:12, fontSize:14 },
  error: { color:'#ff6b6b', textAlign:'center', fontSize:13 },
});
