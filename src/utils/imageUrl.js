import { BASE_URL } from "../../config";

// Server returns wall image paths relative to the PHP script, e.g. "../uploads/x.jpg".
// Blob URLs (offline previews) and absolute URLs pass through unchanged.
export function imageUrl(path) {
  if (!path) return "";
  if (path.startsWith("blob:") || path.startsWith("http")) return path;
  return `${BASE_URL}/${path.replace(/^(\.\.\/)+/, "").replace(/^\//, "")}`;
}
