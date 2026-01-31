/**
 * Stub used by Jest moduleNameMapper so src/lib/api.ts (which uses import.meta) is not compiled.
 */
export const generatePrepPack = jest.fn();
export const savePrepPack = jest.fn();
export const fetchPrepPacks = jest.fn();
export const fetchPrepPackById = jest.fn();
export const updatePrepPack = jest.fn();
export const deletePrepPack = jest.fn();
export const checkHealth = jest.fn().mockResolvedValue(true);
