export const ref = (storage, path) => ({ path });
export const uploadBytes = async (r, blob) => {
  window.__calls.push({ fn: 'uploadBytes', path: r.path, size: blob.size, type: blob.type });
  window.__pdfBlob = blob;
  return { ref: r };
};
export const getDownloadURL = async (r) => {
  window.__calls.push({ fn: 'getDownloadURL', path: r.path });
  return 'blob:mock-download-url';
};
export const getBlob = async () => new Blob();
export const getStorage = () => ({ __mock: true });
