export const api = {
  get: async (endpoint: string, token?: string | null) => {
    const timestamp = Date.now();
    const url = endpoint.includes('?') ? `/api${endpoint}&_t=${timestamp}` : `/api${endpoint}?_t=${timestamp}`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch ${endpoint}`);
    }
    return res.json();
  },
  post: async (endpoint: string, data: any, token?: string | null) => {
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to post ${endpoint}`);
    }
    return res.json();
  },
  put: async (endpoint: string, data: any, token?: string | null) => {
    const res = await fetch(`/api${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to put ${endpoint}`);
    }
    return res.json();
  },
  delete: async (endpoint: string, token?: string | null) => {
    const res = await fetch(`/api${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete ${endpoint}`);
    }
    if (res.status !== 204) {
      return res.json().catch(() => ({}));
    }
  }
};
