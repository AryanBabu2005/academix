// In screens/ForumScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ForumScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardAuthor}>by {item.authorName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={<Text style={styles.title}>Discussion Forum</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts yet. Be the first!</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};
export default ForumScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 20 },
  emptyText: { textAlign: 'center', marginTop: 30, color: 'gray', fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginBottom: 15, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardAuthor: { fontSize: 14, color: 'gray', marginTop: 5 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 5 }
});