export const resolveUploadUrl = (url) => {
  if (!url || /^https?:\/\//i.test(url)) return url;

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (/^https?:\/\//i.test(apiBaseUrl || "")) {
    return new URL(url, new URL(apiBaseUrl).origin).toString();
  }

  return url;
};
