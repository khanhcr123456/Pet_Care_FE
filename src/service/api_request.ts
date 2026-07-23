const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const getHeaders = () => {
    const token = localStorage.getItem('adminAccessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Base function để dùng chung logic fetch, check auth và parse json
export const memCache: Record<string, any> = {};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
    });

    if (res.status === 401 || res.status === 403) {
        throw new Error('Phiên đăng nhập hết hạn hoặc bạn không có quyền Admin. Vui lòng F5 và đăng nhập lại.');
    }

    try {
        const data = await res.json();
        return data;
    } catch {
        return res;
    }
};

export const apiLogin = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return { res, data };
};

export const apiLogout = () => apiFetch('/auth/logout', { method: 'POST' });

export const fetchFcmReport = () => apiFetch('/firebase/fcm-board');

export const fetchFirebaseUsers = () => apiFetch('/firebase/users?limit=100');

export const fetchFirebaseAnalytics = () => apiFetch('/firebase/analytics');

export const sendBroadcastNotification = (payload: { title: string; body: string; type?: string; metadata?: any }) =>
    apiFetch('/firebase/send-notification-all', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

export const toggleUserStatus = (uid: string, disabled: boolean) =>
    apiFetch(`/firebase/users/${uid}/status`, {
        method: 'PUT',
        body: JSON.stringify({ disabled })
    });

export const deleteFirebaseUser = (uid: string) =>
    apiFetch(`/firebase/users/${uid}`, { method: 'DELETE' });
