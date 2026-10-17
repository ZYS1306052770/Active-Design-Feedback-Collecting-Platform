// Imports load only when the researcher configures cloud collection.
// Firebase's official CDN modules (v13.0.0); no npm/build step is required.
const firebaseConfig = window.FIREBASE_CONFIG || {};
export const cloudConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain &&
  firebaseConfig.projectId && firebaseConfig.appId
);
let servicesPromise;
async function getServices() {
  if (!cloudConfigured) throw new Error('Firebase is not configured.');
  if (!servicesPromise) {
    servicesPromise = (async () => {
      const [appModule, authModule, firestoreModule] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js')
      ]);
      const app = appModule.initializeApp(firebaseConfig);
      return {
        auth: authModule.getAuth(app),
        signInAnonymously: authModule.signInAnonymously,
        db: firestoreModule.getFirestore(app),
        addDoc: firestoreModule.addDoc,
        collection: firestoreModule.collection,
        serverTimestamp: firestoreModule.serverTimestamp
      };
    })().catch((error) => { servicesPromise = null; throw error; });
  }
  return servicesPromise;
}
export async function submitToCloud(record) {
  const svc = await getServices();
  const user = svc.auth.currentUser || (await svc.signInAnonymously(svc.auth)).user;
  const doc = await svc.addDoc(svc.collection(svc.db, 'study_feedback'), {
    ...record,
    auth_uid: user.uid,
    created_at: svc.serverTimestamp()
  });
  return doc.id;
}
