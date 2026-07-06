# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v55.0.0/ before writing any code.


Here is my Project Instructions

Instructions
Build a modern developer-focused mobile application using Expo, React Native, and TypeScript that allows users to save, organize, manage, and understand code snippets directly on their device.

The application should follow an offline-first architecture, meaning core functionality must continue to work without an internet connection.

The goal is to create a practical utility app that a developer could genuinely use to store reusable code, manage development resources, and generate AI-powered explanations for snippets.

Core Features
1. Snippet Management
Users should be able to:

Create snippets

Edit snippets

Delete snippets

Search snippets

Mark snippets as favorites

Each snippet should contain:

Title

Code content

Programming language

Tags

The interface should make it easy to browse and organize snippets efficiently.

2. Offline Storage
The application must work without an internet connection.

All snippets should be stored locally using SQLite.

Users should be able to:

Create snippets

Edit snippets

Search snippets

View favorites

while completely offline.

The app should prioritize local-first data access and persistence.

3. File Management
Implement a local file management experience using Expo FileSystem.

Users should be able to:

Attach screenshots to snippets

Save code files locally

Download templates/resources

Browse stored files

Delete files

Move or copy files between folders

The goal is to give developers a simple way to manage resources directly inside the application.

4. AI Code Explanation
Allow users to select a code snippet and generate:

Code explanations

Summaries

Improvement suggestions

Students may use any AI provider of their choice.

The generated response should be displayed in a readable format alongside the selected snippet.

5. Export & Sharing
Users should be able to:

Export snippets as files

Share snippets with other applications

Save exported snippets locally

Supported export formats:

.txt

.js

.json

Storage Requirements
The following storage technologies should be used for their intended purpose:

`TechnologyUsageAsyncStorageTheme and application preferencesSecureStoreAPI keys or sensitive tokensSQLiteSnippet databaseExpo FileSystemLocal file management

Suggested Screens
You are free to improve or extend the application, but at minimum consider:

Home Screen

Create Snippet Screen

Snippet Details Screen

Favorites Screen

File Manager Screen

Settings Screen

Additional screens that improve the user experience are encouraged.

Technical Requirements
Expo

React Native

TypeScript

SQLite

AsyncStorage

SecureStore

Expo FileSystem

Students are expected to follow good project structure, reusable component practices, and clean state management patterns.

Submission Instructions
GitHub repository link

Demo video showcasing all major features

Screenshots of the application

Brief explanation of:

Database structure

Offline storage approach

File management implementation

AI integration workflow

If any bonus features are implemented, mention them in the submission.

Evaluation Parameters
Feature completeness

Offline-first implementation quality

SQLite database design and CRUD operations

File management functionality

AI integration experience

Export and sharing functionality

UI/UX quality and usability

Code quality and project structure

TypeScript usage and maintainability

Error handling and edge-case management

Overall polish and production readiness