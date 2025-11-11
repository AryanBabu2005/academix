// In screens/CreateEventScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreateEventScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async () => {
    if (!title || !date || !location || !description) {
      return Alert.alert("Error", "Please fill out all fields.");
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "events"), {
        title: title,
        date: date, // Note: For a real app, you'd use a DateTimePicker
        location: location,
        description: description,
        createdAt: serverTimestamp()
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Could not create event.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Event Title</Text>
      <TextInput style={styles.input} placeholder="e.g., TechFest 2025" value={title} onChangeText={setTitle} />
      
      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} placeholder="2025-11-15" value={date} onChangeText={setDate} />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} placeholder="e.g., Main Auditorium" value={location} onChangeText={setLocation} />
      
      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Event details..." value={description} onChangeText={setDescription} multiline />

      <Button title={loading ? "Creating..." : "Create Event"} onPress={handleCreateEvent} disabled={loading} />
    </View>
  );
};
export default CreateEventScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: '500', color: 'gray', marginBottom: 10, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, fontSize: 16, borderRadius: 6, backgroundColor: '#f9f9f9' },
  textArea: { height: 100, textAlignVertical: 'top' }
});