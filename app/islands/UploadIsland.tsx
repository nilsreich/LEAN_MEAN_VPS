/**
 * ============================================================================
 * LEAN MEAN VPS - Upload Island
 * ============================================================================
 *
 * WAS:
 * Komponente für das Datei-Management und den Upload in das lokale Dateisystem.
 *
 * WIE:
 * 1. Multipart-Upload: Nutzt 'FormData' und die native Fetch-API für
 *    Streaming-Uploads.
 * 2. File-Safety: Serverseitige Validierung der Dateigröße (10MB Limit) und
 *    automatische UUID-Zuweisung zur Vermeidung von Namenskollisionen.
 * 3. UX: Visuelles Feedback während des Uploads und sofortige Aktualisierung
 *    der Dateiliste mittels Re-Fetching.
 * 4. Metadaten: Speicherung der Dateieigenschaften (Name, Größe, Zeitstempel)
 *    in der SQLite-Metadaten-Tabelle.
 *
 * WARUM:
 * Ermöglicht sicheres Asset-Management direkt auf dem VPS ohne externe
 * Cloud-Abhängigkeiten (S3 etc.), was Latenz und Kosten spart.
 *
 * @version 1.1.0
 * ============================================================================
 */

import { useEffect, useState } from 'hono/jsx';
import { Badge, Card } from '../components/UI';
import { connectivity, mutationQueue } from '../lib/offline';
import { notify } from './ToastIsland';

interface FileInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
}

export default function UploadIsland() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Abrufen der Dateiliste vom Server (Metadaten).
   */
  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/storage/list');
      if (res.ok) {
        const result = await res.json();
        // Erwartet { success: true, data: FileInfo[] }
        setFiles(result.data || []);
      }
    } catch (_e) {
      if (!connectivity.isOnline()) {
        notify('Offline: Dateiliste eingeschränkt', 'info');
      }
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  /**
   * Verarbeitet den File-Upload.
   */
  // biome-ignore lint/suspicious/noExplicitAny: Hono JSX type mismatch
  const onUpload = async (e: any) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!connectivity.isOnline()) {
      notify('Upload im Offline-Modus nicht möglich.', 'error');
      target.value = '';
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': getCsrfToken(),
        },
        body: formData,
      });

      if (res.ok) {
        notify('Datei erfolgreich hochgeladen', 'success');
        fetchFiles();
      } else {
        const data = await res.json();
        notify(data.error || 'Upload fehlgeschlagen', 'error');
      }
    } catch (_e) {
      notify('Netzwerkfehler während des Uploads.', 'error');
    } finally {
      setLoading(false);
      // Input zurücksetzen, um mehrmaliges Auswählen derselben Datei zu ermöglichen
      target.value = '';
    }
  };

  /**
   * Löscht eine Datei anhand ihrer ID.
   */
  const deleteFile = async (id: string) => {
    if (!confirm('Datei wirklich löschen?')) return;
    const url = `/api/storage/${id}`;
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfToken(),
        },
      });
      if (res.ok) {
        notify('Datei gelöscht', 'success');
        fetchFiles();
      } else {
        const data = await res.json();
        notify(data.error || 'Löschen fehlgeschlagen', 'error');
      }
    } catch (_e) {
      if (!connectivity.isOnline()) {
        mutationQueue.add({ url, method: 'DELETE' });
        notify('Löschen für späteren Sync gemerkt', 'warning');
        setFiles((prev) => prev.filter((f) => String(f.id) !== id));
      } else {
        notify('Fehler beim Löschen der Datei', 'error');
      }
    }
  };

  /**
   * Hilfsfunktion zum Auslesen des CSRF-Tokens aus den Cookies.
   */
  const getCsrfToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-10 hover:border-primary/50 transition-colors group relative">
          <input
            type="file"
            onChange={onUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={loading}
          />
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Upload Icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-text">
              {loading ? 'Lade hoch...' : 'Datei hierher ziehen oder klicken'}
            </p>
            <p className="text-sm text-text-muted mt-1">Maximal 10MB pro Datei</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <Card key={file.id} className="group overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <svg
                  className="w-6 h-6 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>File Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <Badge color="primary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
            </div>
            <h4 className="font-medium text-text truncate mb-1" title={file.filename}>
              {file.filename}
            </h4>
            <p className="text-xs text-text-muted mb-4">
              Hochgeladen am {new Date(file.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              <a
                href={`/api/storage/download/${file.id}`}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg flex items-center justify-center transition-colors"
                aria-label={`Datei ${file.filename} herunterladen`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Download</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => deleteFile(file.id)}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg flex items-center justify-center transition-all"
                aria-label={`Datei ${file.filename} löschen`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Delete</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
