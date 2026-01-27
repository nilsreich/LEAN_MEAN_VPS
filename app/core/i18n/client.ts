declare global {
  interface Window {
    __I18N_CLIENT__: Record<string, string>;
  }
}

export const t = (key: string, params: Record<string, string> = {}): string => {
  let message = key;

  // Client-side: use global window object
  if (typeof window !== 'undefined' && window.__I18N_CLIENT__) {
    message = window.__I18N_CLIENT__[key] || key;
  }

  // Placeholder replacement
  Object.keys(params).forEach((k) => {
    message = message.replace(new RegExp(`{${k}}`, 'g'), params[k]);
  });

  return message;
};
