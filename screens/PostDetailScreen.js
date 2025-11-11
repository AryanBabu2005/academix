// In screens/PostDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Button, Alert } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';

const PostDetailScreen = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Fetch the main post content
  useEffect(() => {
    const postRef = doc(db, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (doc) => {
      setPost({ id: doc.id, ...doc.data() });
    });
    return () => unsubscribe();
  }, [postId]);

  // Fetch the comments for the post
  useEffect(() => {
    const commentsQuery = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: newComment,
        authorName: auth.currentUser.email,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      Alert.alert("Error", "Could not add comment.");
    }
  };

  if (!post) return <ActivityIndicator size="large" />;

  return (
    <FlatList
      data={comments}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <View style={styles.postContainer}>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.author}>by {post.authorName}</Text>
          <Text style={styles.content}>{post.content}</Text>
          <Text style={styles.commentsHeader}>Comments</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.commentContainer}>
          <Text style={styles.commentText}>{item.text}</Text>
          <Text style={styles.commentAuthor}>- {item.authorName}</Text>
        </View>
      )}
      ListFooterComponent={
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Write a comment..." value={newComment} onChangeText={setNewComment} />
          <Button title="Post" onPress={handleAddComment} />
        </View>
      }
    />
  );
};
export default PostDetailScreen;

const styles = StyleSheet.create({
  postContainer: { padding: 20, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
  author: { fontSize: 14, color: 'gray', marginVertical: 5 },
  content: { fontSize: 16, marginTop: 10 },
  commentsHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 20, borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
  commentContainer: { padding: 15, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderColor: '#eee' },
  commentText: { fontSize: 15 },
  commentAuthor: { fontSize: 12, color: 'gray', fontStyle: 'italic', marginTop: 5 },
  inputContainer: { flexDirection: 'row', padding: 10, alignItems: 'center', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 20, marginRight: 10 }
});