// In screens/EventsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EventsScreen = () => {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
      <Text style={styles.cardLocation}>{item.location}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading ? <ActivityIndicator size="large" /> : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={<Text style={styles.title}>Upcoming Events</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>No upcoming events found.</Text>}
        />
      )}
    </View>
  );
};
export default EventsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 20 },
  emptyText: { textAlign: 'center', marginTop: 30, color: 'gray', fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginBottom: 15, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: '600' },
  cardDate: { fontSize: 14, color: '#007AFF', fontWeight: '500', marginVertical: 5 },
  cardLocation: { fontSize: 14, color: '#555', fontStyle: 'italic', marginBottom: 5 },
  cardDescription: { fontSize: 14, color: '#333' }
});