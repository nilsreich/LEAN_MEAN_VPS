export interface Dictionary {
  meta: {
    title: {
      landing: string;
      dashboard: string;
    };
  };
  landing: {
    hero: {
      title: string;
      subtitle: string;
    };
    footer: {
      ram: string;
      auth: string;
      ssg: string;
      copyright: string;
    };
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    loginSubtitle: string;
    registerSubtitle: string;
    username: string;
    password: string;
    usernamePlaceholder: string;
    passwordPlaceholder: string;
    loginButton: string;
    registerButton: string;
    switchToRegister: string;
    switchToLogin: string;
    errorGeneric: string;
    errorNetwork: string;
    loading: string;
  };
  dashboard: {
    header: {
      title: string;
      subtitle: string;
    };
    modules: {
      tasks: string;
      storage: string;
      chat: string;
    };
    user: {
      role: string;
      logout: string;
    };
  };
  modules: {
    tasks: {
      title: string;
      badge: string;
      placeholder: string;
      add: string;
      empty: string;
      completed: string;
      markUncompleted: string;
      markCompleted: string;
      offlineLoad: string;
      offlineSave: string;
      errorAdd: string;
      offlineStatus: string;
      errorServer: string;
    };
    chat: {
      status: {
        connecting: string;
        connected: string;
        disconnected: string;
      };
      placeholder: string;
      send: string;
    };
    storage: {
      uploadOffline: string;
      uploadSuccess: string;
      uploadFailed: string;
      uploadNetworkError: string;
      listOffline: string;
      deleteConfirm: string;
      deleteSuccess: string;
      deleteFailed: string;
      deleteOffline: string;
      deleteError: string;
      uploading: string;
      dragDrop: string;
      maxSize: string;
      uploadedAt: string;
      tooltips: {
        upload: string;
        file: string;
        download: string;
        delete: string;
      };
    };
  };
  toast: {
    online: string;
    synced: string;
    syncFailed: string;
    offline: string;
  };
  client: {
    updateAvailable: string;
    updateNow: string;
    offlineReady: string;
  };
}
