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
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function getFundTransactions() {
  return fetchWithAuth('/fund-transactions');
}

export async function createFundTransaction(data: Record<string, unknown>) {
  return fetchWithAuth('/fund-transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFundTransaction(id: string, data: Record<string, unknown>) {
  return fetchWithAuth(`/fund-transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteFundTransaction(id: string) {
  return fetchWithAuth(`/fund-transactions/${id}`, {
    method: 'DELETE',
  });
}
