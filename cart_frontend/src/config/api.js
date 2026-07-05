const resolveDefaultApiBase = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:3500`;
  }

  return "http://127.0.0.1:3500";
};

const REMOTE_API_BASE =
  import.meta.env.VITE_REMOTE_API_BASE || resolveDefaultApiBase();

const API_BASE = import.meta.env.VITE_API_BASE || REMOTE_API_BASE;

const LOCAL_SCANNER_API_BASE =
  import.meta.env.VITE_LOCAL_SCANNER_API_BASE || "http://127.0.0.1:5200";

export const apiUrl = (path) => `${API_BASE}${path}`;

export const remoteApiUrl = (path) => `${REMOTE_API_BASE}${path}`;

export const scannerApiUrl = (path) => `${LOCAL_SCANNER_API_BASE}${path}`;
