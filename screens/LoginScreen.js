// In screens/LoginScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, Image, TouchableOpacity } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log("--- Login attempt started ---"); // NEW LOG 1
    if (!email || !password) {
      Alert.alert("Error", "Please enter an email and password.");
      return;
    }

    console.log("Attempting to sign in with:", email); // NEW LOG 2
    
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredentials => {
        // This log will be seen by the onAuthStateChanged listener in App.js
        // No need to log here, as the listener is the source of truth.
      })
      .catch(error => {
        // --- NEW, MORE DETAILED LOG ---
        console.error("Firebase Login Error:", error.code, error.message);
        Alert.alert("Login Error", error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Academix</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} />
      </View>

      <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.forgotLinkText}>Forgot Password?</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerLinkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
      width: '90%',
      marginTop: 10,
  },
  forgotLink: {
    marginTop: 15,
  },
  forgotLinkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  registerLink: {
    marginTop: 25,
  },
  registerLinkText: {
    color: '#007AFF',
    fontSize: 16,
  }
});