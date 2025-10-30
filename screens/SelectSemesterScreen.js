// In screens/SelectSemesterScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const SelectSemesterScreen = () => {
  const [selectedSem, setSelectedSem] = useState(null);

  const handleSaveSemester = async () => {
    if (!selectedSem) {
      Alert.alert("Selection Required", "Please select your semester.");
      return;
    }
    const user = auth.currentUser;
    if (user) {
      try {
        // Create a document in the 'users' collection with the user's UID
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          semester: selectedSem
        });
        // The navigator in App.js will automatically detect this change and move to the main app
      } catch (error) {
        Alert.alert("Error", "Could not save your semester. Please try again.");
        console.error("Error saving semester: ", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Academix!</Text>
      <Text style={styles.subtitle}>Please select your current semester</Text>
      <View style={styles.buttonGrid}>
        <Button title="Semester 1" onPress={() => setSelectedSem('sem1')} color={selectedSem === 'sem1' ? '#007AFF' : 'gray'} />
        <Button title="Semester 2" onPress={() => setSelectedSem('sem2')} color={selectedSem === 'sem2' ? '#007AFF' : 'gray'} />
        <Button title="Semester 3" onPress={() => setSelectedSem('sem3')} color={selectedSem === 'sem3' ? '#007AFF' : 'gray'} />
        <Button title="Semester 4" onPress={() => setSelectedSem('sem4')} color={selectedSem === 'sem4' ? '#007AFF' : 'gray'} />
        <Button title="Semester 5" onPress={() => setSelectedSem('sem5')} color={selectedSem === 'sem5' ? '#007AFF' : 'gray'} />
        <Button title="Semester 6" onPress={() => setSelectedSem('sem6')} color={selectedSem === 'sem6' ? '#007AFF' : 'gray'} />
        <Button title="Semester 7" onPress={() => setSelectedSem('sem7')} color={selectedSem === 'sem7' ? '#007AFF' : 'gray'} />
        <Button title="Semester 8" onPress={() => setSelectedSem('sem8')} color={selectedSem === 'sem8' ? '#007AFF' : 'gray'} />
        {/* Add more buttons for other semesters as needed */}
      </View>
      <Button title="Save and Continue" onPress={handleSaveSemester} disabled={!selectedSem} />
    </View>
  );
};

export default SelectSemesterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 40,
  },
  buttonGrid: {
    width: '80%',
    marginBottom: 40,
  }
});