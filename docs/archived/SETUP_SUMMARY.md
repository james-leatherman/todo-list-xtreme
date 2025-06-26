# Migration to Mobile: todo-list-xtreme-mobile

## 1. New Repository Structure
- Create a new repo: `todo-list-xtreme-mobile` (separate from this repo).
- This new repo will contain:
  - A React Native frontend (Android/iOS)
  - API client code to connect to the backend in this repo
  - README and setup for mobile

## 2. Backend
- The backend (FastAPI, database, uploads, etc.) stays in this repo (`todo-list-xtreme`).
- The mobile app will consume the backend API via HTTP(S).
- Make sure your backend is accessible to your mobile device (use a public IP, domain, or [ngrok](https://ngrok.com/) for local dev).

## 3. React Native Mobile App Setup
- In the new repo, run:
  ```bash
  npx react-native init todoListXtremeMobile
  cd todoListXtremeMobile
  ```
- Add folders for `screens/`, `components/`, `services/`, etc.
- Copy and adapt your API logic from `frontend/src/services/api.js`.
- Implement screens:
  - Login (with Google OAuth, using `expo-auth-session` or `react-native-app-auth`)
  - Todo List (Kanban/columns, drag-and-drop with `react-native-draggable-flatlist` or similar)
  - Photo upload (with `react-native-image-picker`)
  - Theme support (custom or with `react-native-paper`)

## 4. Feature Parity
- Use the same API endpoints and data models as the web app.
- Maintain a feature checklist to keep web and mobile in sync.
- Optionally, share TypeScript types or validation logic via a `common/` package or npm module.

## 5. Example README for Mobile Repo

```
# Todo List Xtreme Mobile

A React Native mobile app for Todo List Xtreme. Connects to the backend API in the main repo.

## Setup

1. Clone this repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/todo-list-xtreme-mobile.git
   cd todo-list-xtreme-mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set your backend API URL in a `.env` or config file:
   ```
   API_URL=https://your-backend-url.com
   ```
4. Run the app:
   ```bash
   npx react-native run-android
   # or
   npx react-native run-ios
   ```

## Features
- Google OAuth login
- Kanban todo board
- Photo upload
- Theme support (including retro themes)
- Feature parity with web app

## Backend
- The backend API is in the main `todo-list-xtreme` repo.
- Make sure it is running and accessible to your mobile device.
```

## 6. Next Steps
- Create the new repo and initialize React Native as above.
- Copy/adapt API and UI logic from your web frontend.
- Test against your backend API.
- Keep both repos in sync for features and bugfixes.

---

**You are now ready to migrate to a modern, full-featured mobile app!**
