import type { Dictionary } from './types';

export const en: Dictionary = {
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
    loginTitle: 'Welcome Back',
    registerTitle: 'Create Account',
    loginSubtitle: 'Sign in to continue.',
    registerSubtitle: 'Start your VPS App now.',
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'e.g. admin',
    passwordPlaceholder: '••••••••',
    loginButton: 'Sign In',
    registerButton: 'Register',
    switchToRegister: 'No account yet? Register',
    switchToLogin: 'Already have an account? Login',
    errorGeneric: 'Authentication failed',
    errorNetwork: 'Network error. Please try again later.',
    loading: 'Loading...',
  },
  dashboard: {
    header: {
      title: 'System Core',
      subtitle: 'Operational. All subsystems nominal.',
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
      title: 'My Tasks',
      badge: 'Todos',
      placeholder: 'What needs to be done?',
      add: 'Add',
      empty: 'No tasks available.',
      completed: 'Completed',
      markUncompleted: 'Mark as uncompleted',
      markCompleted: 'Mark as completed',
      offlineLoad: 'Offline: Loading local data (if available)',
      offlineSave: 'Change saved locally (Offline)',
      errorAdd: 'Error adding todo.',
      offlineStatus: 'Status change saved locally',
      errorServer: 'Server error',
    },
    chat: {
      status: {
        connecting: 'Connecting...',
        connected: 'Connected',
        disconnected: 'Disconnected',
      },
      placeholder: 'Message to #',
      send: 'Send',
    },
    storage: {
      uploadOffline: 'Upload not possible in offline mode.',
      uploadSuccess: 'File uploaded successfully',
      uploadFailed: 'Upload failed',
      uploadNetworkError: 'Network error during upload.',
      listOffline: 'Offline: File list restricted',
      deleteConfirm: 'Really delete file?',
      deleteSuccess: 'File deleted',
      deleteFailed: 'Deletion failed',
      deleteOffline: 'Deletion marked for later sync',
      deleteError: 'Error deleting file',
      uploading: 'Uploading...',
      dragDrop: 'Drag file here or click',
      maxSize: 'Max 10MB per file',
      uploadedAt: 'Uploaded on',
      tooltips: {
        upload: 'Upload Icon',
        file: 'File Icon',
        download: 'Download',
        delete: 'Delete',
      },
    },
  },
  toast: {
    online: 'Back online! Syncing data...',
    synced: 'actions successfully synced.',
    syncFailed: 'actions failed.',
    offline: 'Offline mode: Changes are saved locally.',
  },
  client: {
    updateAvailable: 'New version available!',
    updateNow: 'Update now',
    offlineReady: 'App is ready for offline use.',
  },
};
