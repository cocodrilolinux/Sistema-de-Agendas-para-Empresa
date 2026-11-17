import { useEffect, useState } from 'react';
import { demoStorage } from '../services/demo/demoStorage';

/** URL temporal de un Blob, revocada al desmontar o cambiar el Blob. */
export function useBlobUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}

/**
 * URL de un adjunto guardado en IndexedDB.
 * En la demostración no hay endpoint de medios: el Blob se lee del navegador
 * y se expone mediante una URL de objeto temporal.
 */
export function useMediaUrl(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setUrl(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    setUrl(null);

    demoStorage.getMedia(id)
      .then((blob) => {
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl(null);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return url;
}
