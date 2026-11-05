import { createStorage } from 'unstorage'

const storage = createStorage()
export const kv = { get: storage.getItem, set: storage.setItem, del: storage.removeItem, keys: storage.getKeys, clear: storage.clear }
