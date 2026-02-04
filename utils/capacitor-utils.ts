
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Helper function to ensure filesystem permissions are granted on native platforms.
 */
const ensureFileSystemPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    const status = await Filesystem.checkPermissions();
    // 'publicStorage' is the specific permission key for Android external storage in Capacitor
    if (status.publicStorage !== 'granted') {
      const request = await Filesystem.requestPermissions();
      return request.publicStorage === 'granted';
    }
    return true;
  } catch (error) {
    console.warn('Error checking filesystem permissions:', error);
    // On some OS versions or configurations, checking might fail but writing might still work 
    // (e.g. Scoped Storage). We return false to be safe, or handle specific error codes.
    return false;
  }
};

/**
 * Generic file saver that uses Capacitor Filesystem on native and browser download on web.
 * @param fileName The name of the file to save.
 * @param data The string content of the file.
 * @param mimeType The MIME type for the web download.
 * @param savedMessage The alert message to show on successful native save.
 */
const saveFile = async (fileName: string, data: string, mimeType: string, savedMessage: string): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Native: Check permissions before attempting to write
      const hasPermission = await ensureFileSystemPermissions();
      
      if (!hasPermission) {
        alert('Storage permission is required to save files to your device.');
        return;
      }

      // Use Capacitor Filesystem to save in the Documents directory.
      await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      alert(savedMessage);
    } else {
      // Web: Fallback to browser download.
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error(`Error saving file ${fileName}:`, error);
    alert(`Failed to save file. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
};


/**
 * Saves the JSON backup file.
 * @param fileName - The name of the file to save.
 * @param data - The JSON string content of the file.
 */
export const saveBackupFile = async (fileName: string, data: string): Promise<void> => {
  await saveFile(
    fileName,
    data,
    'application/json',
    'Backup saved successfully to Documents folder.'
  );
};

/**
 * Saves the JSON structure file.
 * @param fileName - The name of the file to save.
 * @param data - The JSON string content of the file.
 */
export const saveStructureFile = async (fileName: string, data: string): Promise<void> => {
  await saveFile(
    fileName,
    data,
    'application/json',
    'Structure file saved successfully to Documents folder.'
  );
};

/**
 * Saves a CSV export file.
 * @param fileName - The name of the file to save.
 * @param data - The CSV string content of the file.
 */
export const saveCsvFile = async (fileName: string, data: string): Promise<void> => {
    await saveFile(
        fileName,
        data,
        'text/csv;charset=utf-8;',
        'CSV Export saved successfully to Documents folder.'
    );
};

/**
 * Shares data. Uses Capacitor Share on native platforms and Web Share API on web.
 * @param fileName - The name for the file being shared.
 * @param data - The string content to share.
 * @param title - The title for the share dialog.
 */
export const shareBackupData = async (fileName: string, data: string, title: string): Promise<void> => {
    try {
        if (Capacitor.isNativePlatform()) {
            // Native: Save the file to the cache directory first, then share its URI.
            // Writing to Cache usually doesn't require explicit storage permissions on modern Android.
            const result = await Filesystem.writeFile({
                path: fileName,
                data: data,
                directory: Directory.Cache,
                encoding: Encoding.UTF8,
            });

            await Share.share({
                title: title,
                text: `Backup data for Aysha's P&L.`,
                files: [result.uri], 
            });
        } else {
            // Web: Use the Web Share API with a File object for better compatibility.
            const blob = new Blob([data], { type: 'application/json' });
            const file = new File([blob], fileName, { type: 'application/json' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: title,
                    files: [file],
                });
            } else {
                // Fallback for browsers that don't support Web Share API or file sharing.
                alert('Web Share API not supported on this browser. Saving file instead.');
                await saveBackupFile(fileName, data);
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Share was cancelled by the user.');
            return;
        }
        console.error('Error sharing data:', error);
        alert(`Failed to share data. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
};


/**
 * Shares an image file. Uses Capacitor Share on native platforms and Web Share API on web.
 * @param fileName The name of the file (e.g., 'report.png').
 * @param base64Data The base64 data URI of the image.
 * @param title The title for the share dialog.
 * @param text The accompanying text for the share.
 */
export const shareImageFile = async (fileName: string, base64Data: string, title: string, text: string) => {
    try {
        if (Capacitor.isNativePlatform()) {
            // Native: Save the base64 data URL as a file in the cache directory.
            // IMPORTANT: Strip the 'data:image/...' prefix for Filesystem.writeFile on binary data
            // to avoid potential encoding issues causing crashes on Android.
            const dataToWrite = base64Data.replace(/^data:image\/\w+;base64,/, "");

            const result = await Filesystem.writeFile({
                path: fileName,
                data: dataToWrite, 
                directory: Directory.Cache,
            });

            await Share.share({
                title: title,
                text: text,
                files: [result.uri],
                dialogTitle: 'Share Report'
            });
        } else {
            // Web: Convert base64 data URI to a File object for the Web Share API.
            const response = await fetch(base64Data);
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: blob.type });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: title,
                    text: text,
                    files: [file],
                });
            } else {
                // Fallback for browsers that don't support sharing files.
                const a = document.createElement('a');
                a.href = base64Data;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Share was cancelled by the user.');
            return;
        }
        console.error('Error sharing image:', error);
        alert(`Failed to share image. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
};
