/** Staff LAN API port. Local development can override it with VITE_API_URL. */
const LAN_API_PORT = '3000'

/** LAN backend (dashboard, walk-in, phone, import). */
export function lanApiUrl(): string {
    const fromEnv = import.meta.env.VITE_API_URL
    if (fromEnv) {
        return fromEnv.replace(/\/$/, '')
    }
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:${LAN_API_PORT}`
    }
    return `http://localhost:${LAN_API_PORT}`
}

/** Cloud API for web assignment. Falls back to LAN for all-in-one testing. */
export function cloudApiUrl(): string {
    const fromEnv = import.meta.env.VITE_CLOUD_API_URL
    if (fromEnv) {
        return fromEnv.replace(/\/$/, '')
    }
    return lanApiUrl()
}

function authenticatedFetch(
    token: string | undefined,
    input: RequestInfo | URL,
    init: RequestInit = {},
): Promise<Response> {
    if (!token) {
        return Promise.reject(new Error('Staff API authentication is not configured'));
    }
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
}

export function staffFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return authenticatedFetch(import.meta.env.VITE_STAFF_API_KEY, input, init);
}

export function importFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return authenticatedFetch(import.meta.env.VITE_IMPORT_API_KEY, input, init);
}
