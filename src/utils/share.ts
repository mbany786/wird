import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type ShareResult = 'shared' | 'cancelled' | 'downloaded';

interface ShareFileOptions {
  filename: string;
  /** Text content (JSON, CSV…) or binary bytes (XLSX, PDF…) */
  data: string | Uint8Array | ArrayBuffer;
  mimeType: string;
  /** Title shown on the share sheet / email subject */
  title?: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function isCancel(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message ?? e).toLowerCase();
  return msg.includes('cancel') || msg.includes('abort');
}

/**
 * Hands a file to the user.
 * - iOS / Android app: writes it to the cache folder and opens the system share sheet
 *   (Save to Files, AirDrop, Mail, iCloud Drive…). Browser-style downloads don't work inside the app.
 * - Web: uses the Web Share API when files can be shared, otherwise a normal download.
 */
export async function shareFile({ filename, data, mimeType, title }: ShareFileOptions): Promise<ShareResult> {
  const bytes = typeof data === 'string' ? null : data instanceof Uint8Array ? data : new Uint8Array(data);

  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: filename,
      directory: Directory.Cache,
      ...(bytes ? { data: toBase64(bytes) } : { data: data as string, encoding: Encoding.UTF8 }),
      recursive: true
    });
    try {
      await Share.share({ title: title ?? filename, files: [written.uri], dialogTitle: title ?? filename });
      return 'shared';
    } catch (e) {
      if (isCancel(e)) return 'cancelled';
      throw e;
    }
  }

  const blob = new Blob([bytes ? (bytes as Uint8Array<ArrayBuffer>) : (data as string)], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: title ?? filename });
      return 'shared';
    } catch (e) {
      if (isCancel(e)) return 'cancelled';
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

/** Reads a file the user picked with an <input type="file">. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsText(file);
  });
}
