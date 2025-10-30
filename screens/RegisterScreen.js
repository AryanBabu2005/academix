// In screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role is student

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter an email and password.");
      return;
    }

    try {
      // 1. Create the user in Firebase Authentication
      const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredentials.user;

      // 2. Create a user profile document in Firestore with their role
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: role,
        // Semester is not set here; students will do it on the next screen
      });

      console.log('User registered and profile created!');
      // The onAuthStateChanged listener in App.js will handle navigation
    } catch (error) {
      Alert.alert("Registration Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

      <Text style={styles.label}>I am a:</Text>
      <View style={styles.roleSelector}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'student' && styles.selectedRole]}
          onPress={() => setRole('student')}
        >
          <Text style={[styles.roleText, role === 'student' && styles.selectedRoleText]}>Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'faculty' && styles.selectedRole]}
          onPress={() => setRole('faculty')}
        >
          <Text style={[styles.roleText, role === 'faculty' && styles.selectedRoleText]}>Faculty</Text>
        </TouchableOpacity>
      </View>

      <Button title="Register" onPress={handleSignUp} />
      <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  input: { width: '100%', padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#f9f9f9' },
  label: { fontSize: 16, color: 'gray', marginTop: 15, marginBottom: 10 },
  roleSelector: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  roleButton: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  selectedRole: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  roleText: { fontSize: 16, color: '#333' },
  selectedRoleText: { color: '#fff', fontWeight: 'bold' },
  loginLink: { marginTop: 20 },
  loginLinkText: { color: '#007AFF', textAlign: 'center' }
});