'use server';

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = cookies().get('auth_token')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET' && options.method !== 'DELETE') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let bodyText = '';
    try { bodyText = await res.text(); } catch {}
    console.error(`[fetchWithAuth ERROR] URL: ${API_BASE_URL}${endpoint} | Status: ${res.status} | Body: ${bodyText}`);
    
    let data: Record<string, unknown> = {};
    try {
      if (bodyText) data = JSON.parse(bodyText);
    } catch {}
    
    throw new Error((data.error as string) || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function getIpos() {
  return fetchWithAuth('/ipos');
}

export async function getIpo(id: string) {
  return fetchWithAuth(`/ipos/${id}`);
}

export async function createIpo(data: Record<string, unknown>) {
  return fetchWithAuth('/ipos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIpo(id: string, data: Record<string, unknown>) {
  return fetchWithAuth(`/ipos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteIpo(id: string) {
  return fetchWithAuth(`/ipos/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchLiveIpos() {
  return fetchWithAuth('/ipos/fetch-live', {
    method: 'POST',
  });
}
