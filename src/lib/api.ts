export const api = {
  get: async (endpoint: string, token?: string | null) => {
    const timestamp = Date.now();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const url = endpoint.includes('?') ? `${baseUrl}/api${endpoint}&_t=${timestamp}` : `${baseUrl}/api${endpoint}?_t=${timestamp}`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      let err;
      try { err = JSON.parse(errText); } catch { err = { error: errText || `Failed to fetch ${endpoint}` }; }
      throw new Error(err.error || `Failed to fetch ${endpoint}`);
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  },
  post: async (endpoint: string, data: any, token?: string | null) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const res = await fetch(`${baseUrl}/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errText = await res.text();
      let err;
      try { err = JSON.parse(errText); } catch { err = { error: errText || `Failed to post ${endpoint}` }; }
      throw new Error(err.error || `Failed to post ${endpoint}`);
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
  },
  put: async (endpoint: string, data: any, token?: string | null) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const res = await fetch(`${baseUrl}/api${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errText = await res.text();
      let err;
      try { err = JSON.parse(errText); } catch { err = { error: errText || `Failed to put ${endpoint}` }; }
      throw new Error(err.error || `Failed to put ${endpoint}`);
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
  },
  delete: async (endpoint: string, token?: string | null) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const res = await fetch(`${baseUrl}/api${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      let err;
      try { err = JSON.parse(errText); } catch { err = { error: errText || `Failed to delete ${endpoint}` }; }
      throw new Error(err.error || `Failed to delete ${endpoint}`);
    }
    if (res.status !== 204) {
      const text = await res.text();
      try { return JSON.parse(text); } catch { return null; }
    }
  }
};

/**
 * Compresses an image file or base64 string to be suitable for database storage.
 */
export function compressImage(fileOrBase64: File | string, maxWidth: number = 1000, quality: number = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src); // fallback
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Export to highly compressed JPEG
        const compressedBase = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase);
      };
      img.onerror = () => {
        resolve(src); // fallback
      };
      img.src = src;
    };

    if (fileOrBase64 instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processImage(e.target.result as string);
        } else {
          resolve(""); // fallback
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(fileOrBase64);
    } else {
      processImage(fileOrBase64);
    }
  });
}

