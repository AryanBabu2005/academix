// In App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import all necessary screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SelectSemesterScreen from './screens/SelectSemesterScreen';
// Student Screens
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import TimetableScreen from './screens/TimetableScreen';
import CalculatorScreen from './screens/CalculatorScreen';
import EventsScreen from './screens/EventsScreen';
import ForumScreen from './screens/ForumScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import ChatScreen from './screens/ChatScreen'; // --- IMPORT THE NEW CHAT SCREEN ---
// Faculty Screens
import FacultyDashboardScreen from './screens/FacultyDashboardScreen';
import TakeAttendanceScreen from './screens/TakeAttendanceScreen';
import CancelClassScreen from './screens/CancelClassScreen';
import DeclareHolidayScreen from './screens/DeclareHolidayScreen';
import CreateEventScreen from './screens/CreateEventScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- AUTHENTICATION STACK (Unchanged) ---
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> 
    </Stack.Navigator>
  );
}

// --- CAMPUS STACK (Unchanged) ---
function CampusStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="Events" component={EventsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Forum" component={ForumScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Create Post' }} />
    </Stack.Navigator>
  );
}

// --- STUDENT BOTTOM TAB NAVIGATOR (Unchanged) ---
function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Campus') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Analytics') iconName = focused ? 'analytics' : 'analytics-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person-circle' : 'person-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Campus" component={CampusStack} />
      <Tab.Screen name="Analytics" component={CalculatorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- MAIN NAVIGATOR COMPONENT (UPDATED) ---
const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(undefined);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Effect 1: Listen for Authentication changes (Unchanged)
  useEffect(() => {
    const authSubscriber = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) {
        setLoadingProfile(true);
      } else {
        setUserProfile(null);
      }
    });
    return authSubscriber;
  }, []);

  // Effect 2: Listen for User Profile changes (Unchanged)
  useEffect(() => {
    let profileSubscriber = null;
    if (user && loadingProfile) {
      const userDocRef = doc(db, 'users', user.uid);
      profileSubscriber = onSnapshot(userDocRef, (doc) => {
        setUserProfile(doc.exists() ? doc.data() : null);
        setLoadingProfile(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setLoadingProfile(false);
      });
    } else if (!user) {
      setUserProfile(null);
    }
    return () => {
      if (profileSubscriber) {
        profileSubscriber();
      }
    };
  }, [user, loadingProfile]);

  // Show loading indicator (Unchanged)
  if (loadingAuth || loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // --- Render the correct navigator based on the final user state ---
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : userProfile?.role === 'faculty' ? (
        // User is Faculty -> Show Faculty screens
        <>
          <Stack.Screen name="FacultyDashboard" component={FacultyDashboardScreen} />
          <Stack.Screen name="TakeAttendance" component={TakeAttendanceScreen} options={{ title: 'Digital Register', headerShown: true }}/>
          <Stack.Screen name="CancelClass" component={CancelClassScreen} options={{ title: 'Cancel a Class', headerShown: true }}/>
          <Stack.Screen name="DeclareHoliday" component={DeclareHolidayScreen} options={{ title: 'Declare a Holiday', headerShown: true }}/>
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event', headerShown: true }}/>
        </>
      ) : userProfile?.semester ? (
        // User is Student WITH a semester -> Show Student screens
        <>
          <Stack.Screen name="StudentApp" component={StudentTabs} />
          <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'My Timetable', headerShown: true }}/>
          {/* --- ADD THE CHAT SCREEN (as a modal) --- */}
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ 
              headerShown: true, 
              title: 'Academix AI Assistant',
              presentation: 'modal', // This makes it slide up from the bottom
            }}
          />
        </>
      ) : (
        // User is Student WITHOUT a semester
        <Stack.Screen name="SelectSemester" component={SelectSemesterScreen} />
      )}
    </Stack.Navigator>
  );
};

// --- Main App Component ---
export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});