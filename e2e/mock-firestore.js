export const collection = (db, name) => ({ name });
export const serverTimestamp = () => 'SERVER_TS';
export const addDoc = async (col, data) => {
  window.__calls.push({ fn: 'addDoc', col: col.name, data: JSON.parse(JSON.stringify({ ...data, createdAt: 'SERVER_TS' })) });
  return { id: 'mock-doc-id' };
};
export const query = () => ({});
export const where = () => ({});
export const orderBy = () => ({});
export const getDocs = async () => ({ docs: [] });
export const limit = () => ({});
export const getFirestore = () => ({ __mock: true });
