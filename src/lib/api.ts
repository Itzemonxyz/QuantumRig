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
