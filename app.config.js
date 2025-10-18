// App configuration with env support for Expo
// Exposes Firebase config to the app via extra

import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: 'PG locator',
  slug: config?.slug || 'Kahinexa_PG',
  extra: {
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
    eas: {
      projectId: process.env.EAS_PROJECT_ID || undefined,
    },
  },
});


