Academix - The All-in-One Campus AppAcademix is a comprehensive, role-based mobile application built with React Native and Firebase. It serves as a one-stop solution for both students and faculty, streamlining academic management and campus life.This project was built to solve the problem of fragmented and disengaging college platforms by providing a single, beautiful, and intelligent app for all campus needs.
Features
For Students
Role-Based Login: Secure authentication with a "Student" role.
Personalized Dashboard: A central hub showing key academic information.
Dynamic Timetable: View your weekly class schedule, fetched live from the database.
Course Hub: See all your courses for the semester, with links to resources like video playlists.
Advanced Attendance Calculator:Select any course and a date range.Get a precise attendance percentage (e.g., "80.5%").The calculation is smart: it correctly accounts for multi-hour lectures (e.g., a 2-hour class counts as 2 units), holidays, and classes canceled by the professor.

For Faculty
Role-Based Login: Secure authentication with a "Faculty" role, unlocking an administrative dashboard.
Digital Attendance Register:Select your current class.See a full list of all enrolled students.Quickly mark attendance for each student (e.g., [0], [1], or [2] units for a 2-hour class).Handle latecomers by updating the register in real-time.
Class & Holiday Management:Cancel a Class: Mark a specific class as canceled for a specific date. This is automatically factored into every student's attendance calculation.
Declare a Holiday: Announce a global holiday for the college, which is also factored into all calculations.
Secure Registration: New users can sign up as either "Student" or "Faculty" right from the start.

Tech Stack
Frontend: React Native (Expo)
Backend & Database: Firebase
Firestore: Real-time NoSQL database for all app data (users, courses, attendance).
Firebase Authentication: For handling user login, registration, and password resets.
Navigation: React Navigation
UI Components: react-native-picker-select, @react-native-community/datetimepicker, react-native-animatableIcons: @expo/vector-icons🚀 How to Run This ProjectTo get a local copy up and running, follow these steps.
1. Firebase Backend Setup (Crucial)
This project is powered by Firebase. You must create your own Firebase project to run it.
Create a Firebase Project: Go to the Firebase Console and create a new project.
Enable Authentication: In the "Build" section, go to Authentication -> Sign-in method and enable "Email/Password".
Create Firestore Database: Go to Firestore Database and create a new database. 
Start in Test Mode (this allows you to write the security rules).
Set Up Database Structure: You must create the following collections and documents for the app to work:
*users (collection): Will be populated by the app. When you create your faculty user, you must manually add the field role: "faculty".semesters (collection):sem1 (document):courses (sub-collection):[auto-id] (document): { courseName: "Calculus", courseCode: "MATH101" }timetable (sub-collection):[auto-id] (document): { mainCourseId: "...", courseName: "Calculus", dayOfWeek: 1, duration: 2, instructorId: "..." }holidays (collection): (Can be empty)cancellations (collection): (Can be empty)attendance (collection): (Can be empty)Set Firestore Rules: Go to the Rules tab and paste in the following rules. This is essential for security.rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isFaculty() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'faculty';
    }

    match /users/{userId} {
      allow read, update: if request.auth.uid == userId;
      allow create: if request.auth.uid != null;
    }

    match /semesters/{semesterId}/{document=**} {
      allow read: if request.auth != null;
    }

    match /attendance/{docId} {
      allow read, create: if request.auth.uid == request.resource.data.userId || isFaculty();
      allow update: if isFaculty();
    }

    match /holidays/{docId} {
      allow read: if request.auth != null;
      allow create, delete: if isFaculty();
    }

    match /cancellations/{docId} {
      allow read: if request.auth != null;
      allow create, delete: if isFaculty();
    }
  }
}
Get Config Keys: In your Firebase Project Settings, click "Add app" and select the Web icon (</>).Copy the firebaseConfig object (your API keys).Paste these keys into the firebaseConfig.js file in this project.2. Local Project SetupClone the repo:git clone [https://github.com/YOUR_USERNAME/academix.git](https://github.com/YOUR_USERNAME/academix.git)
cd academix
Install dependencies:npm install
Fix Expo dependencies:npx expo install --fix
3. Running the AppStart the server:npx expo start
Scan the QR code with the Expo Go app on your Android or iOS device.Register a new user:Register one user as "Faculty". Go to Firestore and manually add their role: "faculty" field.Register another user as "Student".