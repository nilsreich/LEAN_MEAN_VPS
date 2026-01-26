import type { Dictionary } from './types';

export const de: Dictionary = {
  meta: {
    title: {
      landing: 'Welcome | LEAN MEAN VPS',
      dashboard: 'Dashboard | LEAN MEAN VPS',
    },
  },
  landing: {
    hero: {
      title: 'LEAN MEAN',
      subtitle: 'BUN • HONO • SQLITE',
    },
    footer: {
      ram: '512MB RAM OPTIMIZED',
      auth: 'ARGON2ID AUTH',
      ssg: 'SSG READY',
      copyright: '© 2026 LEAN MEAN TEMPLATE',
    },
  },
  auth: {
    loginTitle: 'Willkommen zurück',
    registerTitle: 'Account erstellen',
    loginSubtitle: 'Melde dich an, um fortzufahren.',
    registerSubtitle: 'Starte jetzt mit deiner VPS-App.',
    username: 'Benutzername',
    password: 'Passwort',
    usernamePlaceholder: 'z.B. admin',
    passwordPlaceholder: '••••••••',
    loginButton: 'Anmelden',
    registerButton: 'Registrieren',
    switchToRegister: 'Noch keinen Account? Registrieren',
    switchToLogin: 'Bereits einen Account? Login',
    errorGeneric: 'Fehler beim Authentifizieren',
    errorNetwork: 'Netzwerkfehler. Bitte später erneut versuchen.',
    loading: 'Laden...',
  },
  dashboard: {
    header: {
      title: 'System Core',
      subtitle: 'Betriebsbereit. Alle Subsysteme nominal.',
    },
    modules: {
      tasks: 'Task Management',
      storage: 'Encrypted Storage',
      chat: 'Team Communication',
    },
    user: {
      role: 'Admin-Level Node',
      logout: 'Exit',
    },
  },
  modules: {
    tasks: {
      title: 'Meine Aufgaben',
      badge: 'Todos',
      placeholder: 'Was gibt es zu tun?',
      add: 'Hinzufügen',
      empty: 'Keine Aufgaben vorhanden.',
      completed: 'Erledigt',
      markUncompleted: 'Als unerledigt markieren',
      markCompleted: 'Als erledigt markieren',
      offlineLoad: 'Offline: Lade lokale Daten (falls vorhanden)',
      offlineSave: 'Änderung lokal gespeichert (Offline)',
      errorAdd: 'Fehler beim Hinzufügen des Todos.',
      offlineStatus: 'Status-Änderung lokal gespeichert',
      errorServer: 'Server error',
    },
    chat: {
      status: {
        connecting: 'Verbindet...',
        connected: 'Verbunden',
        disconnected: 'Getrennt',
      },
      placeholder: 'Nachricht an #',
      send: 'Senden',
    },
    storage: {
      uploadOffline: 'Upload im Offline-Modus nicht möglich.',
      uploadSuccess: 'Datei erfolgreich hochgeladen',
      uploadFailed: 'Upload fehlgeschlagen',
      uploadNetworkError: 'Netzwerkfehler während des Uploads.',
      listOffline: 'Offline: Dateiliste eingeschränkt',
      deleteConfirm: 'Datei wirklich löschen?',
      deleteSuccess: 'Datei gelöscht',
      deleteFailed: 'Löschen fehlgeschlagen',
      deleteOffline: 'Löschen für späteren Sync gemerkt',
      deleteError: 'Fehler beim Löschen der Datei',
      uploading: 'Lade hoch...',
      dragDrop: 'Datei hierher ziehen oder klicken',
      maxSize: 'Maximal 10MB pro Datei',
      uploadedAt: 'Hochgeladen am',
      tooltips: {
        upload: 'Upload Icon',
        file: 'File Icon',
        download: 'Download',
        delete: 'Delete',
      },
    },
  },
  toast: {
    online: 'Wieder online! Synchronisiere Daten...',
    synced: 'Aktionen erfolgreich synchronisiert.',
    syncFailed: 'Aktionen fehlgeschlagen.',
    offline: 'Offline-Modus: Änderungen werden lokal gespeichert.',
  },
  client: {
    updateAvailable: 'Neue Version verfügbar!',
    updateNow: 'Jetzt aktualisieren',
    offlineReady: 'App ist bereit für den Offline-Betrieb.',
  },
};
