// In screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Listen for changes to the user's profile document
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    auth.signOut().catch(error => alert(error.message));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.email}>{userProfile?.email}</Text>
      <Text style={styles.semester}>Semester: {userProfile?.semester}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Sign Out" onPress={handleSignOut} />
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 10,
  },
  semester: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 30,
    backgroundColor: '#e9ecef',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    overflow: 'hidden', // Ensures the borderRadius is applied
  },
  buttonContainer: {
    width: '60%',
  },
});