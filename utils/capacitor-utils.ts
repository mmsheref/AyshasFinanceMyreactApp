import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Saves a file to the device. Uses Capacitor Filesystem on native platforms
 * and a standard browser download for web.
 * @param fileName - The name of the file to save.
 * @param data - The string content of the file.
 */
export const saveBackupFile = async (fileName: string, data: string): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Native: Use Capacitor Filesystem to save in the Documents directory.
      await Filesystem.requestPermissions();
      const result = await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      alert(`Backup saved successfully to Documents folder.`);
    } else {
      // Web: Fallback to browser download.
      const blob = new Blob([data], { type: 'application/json' });
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
    console.error('Error saving file:', error);
    alert(`Failed to save file. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
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
            const result = await Filesystem.writeFile({
                path: fileName,
                data: data,
                directory: Directory.Cache,
                encoding: Encoding.UTF8,
            });

            await Share.share({
                title: title,
                text: `Backup data for Aysha's P&L.`,
                url: result.uri, // The URI of the saved file
            });
        } else {
            // Web: Use the Web Share API with text, as file sharing can be inconsistent.
             if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: data,
                });
            } else {
                // Fallback for browsers that don't support Web Share API.
                alert('Web Share API is not supported on this browser. Saving file instead.');
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
            // Capacitor's Share plugin can directly handle base64 data URIs.
            await Share.share({
                title: title,
                text: text,
                url: base64Data,
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
                alert('Report image downloaded.');
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
