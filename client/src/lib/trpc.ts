import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, createTRPCClient as createVanillaTRPC, httpLink, TRPCClientError } from '@trpc/client';
import type { AppRouter } from '../../../server/src/trpc/router';

export const trpc = createTRPCReact<AppRouter>();

// Dedicated vanilla client for token refresh — uses httpLink (no auth interceptor)
// so we avoid circular dependency: 401 → refresh → 401 → refresh → ...
const refreshClient = createVanillaTRPC<AppRouter>({
  links: [httpLink({ url: '/api/trpc' })],
});

// --- auth event bus: lets trpc.ts notify React without importing React ---
type AuthListener = () => void;
const authListeners = new Set<AuthListener>();
export function onAuthExpired(listener: AuthListener) {
  authListeners.add(listener);
  return () => { authListeners.delete(listener); };
}
function notifyAuthExpired() {
  authListeners.forEach((fn) => fn());
}

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// Flag to stop all refresh attempts once the session is dead
let sessionExpired = false;

export function resetSessionFlag() {
  sessionExpired = false;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Session already marked expired — don't bother trying
  if (sessionExpired) return null;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    sessionExpired = true;
    clearTokens();
    notifyAuthExpired();
    return null;
  }

  try {
    const result = await refreshClient.auth.refreshToken.mutate({ refreshToken });
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
      return result.accessToken;
    }
    sessionExpired = true;
    clearTokens();
    notifyAuthExpired();
    return null;
  } catch (err) {
    if (err instanceof TRPCClientError) {
      sessionExpired = true;
      clearTokens();
      notifyAuthExpired();
    }
    return null;
  }
}

function getOrRefreshToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        async headers() {
          // If session expired, try a refresh before sending the request
          if (sessionExpired) return {};

          const token = getAccessToken();
          return token ? { authorization: `Bearer ${token}` } : {};
        },
        async fetch(url, options) {
          let response = await globalThis.fetch(url, options);

          if (response.status === 401) {
            const newToken = await getOrRefreshToken();
            if (newToken) {
              const newOptions = {
                ...options,
                headers: {
                  ...Object.fromEntries(
                    new Headers(options?.headers).entries(),
                  ),
                  authorization: `Bearer ${newToken}`,
                },
              };
              response = await globalThis.fetch(url, newOptions);
            }
          }

          return response;
        },
      }),
    ],
  });
}
