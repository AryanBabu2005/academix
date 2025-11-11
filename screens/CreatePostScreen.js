// In screens/CreatePostScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreatePostScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!title || !content) {
      return Alert.alert("Error", "Please fill out both the title and content.");
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "posts"), {
        title: title,
        content: content,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.email, // Using email as name for simplicity
        createdAt: serverTimestamp()
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Could not submit post.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Post Title</Text>
      <TextInput style={styles.input} placeholder="A catchy title..." value={title} onChangeText={setTitle} />
      
      <Text style={styles.label}>Post Content</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="What's on your mind?" value={content} onChangeText={setContent} multiline />

      <Button title={loading ? "Posting..." : "Submit Post"} onPress={handlePost} disabled={loading} />
    </View>
  );
};
export default CreatePostScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: '500', color: 'gray', marginBottom: 10, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, fontSize: 16, borderRadius: 6, backgroundColor: '#f9f9f9' },
  textArea: { height: 150, textAlignVertical: 'top' }
});