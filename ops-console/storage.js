(function attachPersonaLabsOpsStorage(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsOpsStorage = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsOpsStorage() {
  "use strict";

  const DB_NAME = "PersonaLabsSemanticOps";
  const DB_VERSION = 2;
  const LOCAL_STORAGE_PREFIX = "PersonaLabsSemanticOps";
  const STORE_SCHEMAS = Object.freeze({
    observations: Object.freeze({
      keyPath: "observationId",
      indexes: Object.freeze(["sourceType", "query", "observedAt", "pipelineVersion"])
    }),
    classifications: Object.freeze({
      keyPath: "classificationId",
      indexes: Object.freeze(["observationId", "actualCategory", "pipelineVersion", "classifiedAt"])
    }),
    traces: Object.freeze({
      keyPath: "traceRecordId",
      indexes: Object.freeze(["observationId", "classificationId", "pipelineVersion", "capturedAt"])
    }),
    reviews: Object.freeze({
      keyPath: "reviewId",
      indexes: Object.freeze(["observationId", "reviewerDecision", "expectedCategory", "reviewedAt"])
    }),
    replayPacks: Object.freeze({
      keyPath: "replayPackId",
      indexes: Object.freeze(["createdAt", "sourcePipelineVersion"])
    }),
    regressionSnapshots: Object.freeze({
      keyPath: "snapshotId",
      indexes: Object.freeze(["createdAt", "basePipelineVersion", "comparisonPipelineVersion"])
    }),
    reliabilitySnapshots: Object.freeze({
      keyPath: "reliabilitySnapshotId",
      indexes: Object.freeze(["createdAt", "pipelineVersion", "healthStatus"])
    }),
    goldenDatasets: Object.freeze({
      keyPath: "goldenDatasetId",
      indexes: Object.freeze(["createdAt", "pipelineVersion", "immutable"])
    }),
    adversarialRuns: Object.freeze({
      keyPath: "adversarialRunId",
      indexes: Object.freeze(["createdAt", "pipelineVersion", "attackFamily"])
    }),
    boundaryReports: Object.freeze({
      keyPath: "boundaryReportId",
      indexes: Object.freeze(["createdAt", "pipelineVersion"])
    })
  });

  const STORE_NAMES = Object.freeze(Object.keys(STORE_SCHEMAS));

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function createRecordId(prefix) {
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now().toString(36)}_${random}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function assertStoreName(storeName) {
    if (!STORE_SCHEMAS[storeName]) {
      throw new Error(`Unknown PersonaLabs ops store: ${storeName}`);
    }
  }

  function storeKey(storageKeyPrefix, storeName) {
    return `${storageKeyPrefix}:${storeName}`;
  }

  function readLocalStore(storage, storageKeyPrefix, storeName) {
    assertStoreName(storeName);
    if (!storage || typeof storage.getItem !== "function") {
      return [];
    }

    try {
      const parsed = JSON.parse(storage.getItem(storeKey(storageKeyPrefix, storeName)) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeLocalStore(storage, storageKeyPrefix, storeName, records) {
    assertStoreName(storeName);
    if (!storage || typeof storage.setItem !== "function") {
      return;
    }

    storage.setItem(storeKey(storageKeyPrefix, storeName), JSON.stringify(records || []));
  }

  function createLocalStorageAdapter(options) {
    const storage = options && options.storage;
    const storageKeyPrefix = options && options.prefix || LOCAL_STORAGE_PREFIX;

    return {
      type: "localStorage",
      dbName: DB_NAME,
      schemas: STORE_SCHEMAS,

      async put(storeName, record) {
        assertStoreName(storeName);
        const schema = STORE_SCHEMAS[storeName];
        const next = clone(record || {});
        if (!next[schema.keyPath]) {
          next[schema.keyPath] = createRecordId(storeName);
        }

        const records = readLocalStore(storage, storageKeyPrefix, storeName);
        const index = records.findIndex((item) => item[schema.keyPath] === next[schema.keyPath]);
        if (index >= 0) {
          records[index] = next;
        } else {
          records.unshift(next);
        }
        writeLocalStore(storage, storageKeyPrefix, storeName, records);
        return clone(next);
      },

      async bulkPut(storeName, records) {
        const saved = [];
        for (const record of records || []) {
          saved.push(await this.put(storeName, record));
        }
        return saved;
      },

      async get(storeName, id) {
        assertStoreName(storeName);
        const schema = STORE_SCHEMAS[storeName];
        return clone(readLocalStore(storage, storageKeyPrefix, storeName).find((item) => item[schema.keyPath] === id) || null);
      },

      async list(storeName) {
        assertStoreName(storeName);
        return clone(readLocalStore(storage, storageKeyPrefix, storeName));
      },

      async delete(storeName, id) {
        assertStoreName(storeName);
        const schema = STORE_SCHEMAS[storeName];
        const records = readLocalStore(storage, storageKeyPrefix, storeName).filter((item) => item[schema.keyPath] !== id);
        writeLocalStore(storage, storageKeyPrefix, storeName, records);
      },

      async clear(storeName) {
        assertStoreName(storeName);
        writeLocalStore(storage, storageKeyPrefix, storeName, []);
      }
    };
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  function openIndexedDb(indexedDBRef) {
    return new Promise((resolve, reject) => {
      const request = indexedDBRef.open(DB_NAME, DB_VERSION);
      request.addEventListener("upgradeneeded", () => {
        const db = request.result;
        STORE_NAMES.forEach((storeName) => {
          const schema = STORE_SCHEMAS[storeName];
          const store = db.objectStoreNames.contains(storeName)
            ? request.transaction.objectStore(storeName)
            : db.createObjectStore(storeName, { keyPath: schema.keyPath });
          schema.indexes.forEach((indexName) => {
            if (!store.indexNames.contains(indexName)) {
              store.createIndex(indexName, indexName, { unique: false });
            }
          });
        });
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  function createIndexedDbAdapter(options) {
    const indexedDBRef = options && options.indexedDB;
    let dbPromise = null;

    function db() {
      if (!dbPromise) {
        dbPromise = openIndexedDb(indexedDBRef);
      }
      return dbPromise;
    }

    async function transaction(storeName, mode, callback) {
      assertStoreName(storeName);
      const database = await db();
      const tx = database.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = await callback(store);
      await new Promise((resolve, reject) => {
        tx.addEventListener("complete", resolve);
        tx.addEventListener("abort", () => reject(tx.error));
        tx.addEventListener("error", () => reject(tx.error));
      });
      return result;
    }

    return {
      type: "indexedDB",
      dbName: DB_NAME,
      schemas: STORE_SCHEMAS,

      async put(storeName, record) {
        const schema = STORE_SCHEMAS[storeName];
        const next = clone(record || {});
        if (!next[schema.keyPath]) {
          next[schema.keyPath] = createRecordId(storeName);
        }
        await transaction(storeName, "readwrite", (store) => requestToPromise(store.put(next)));
        return clone(next);
      },

      async bulkPut(storeName, records) {
        const saved = [];
        for (const record of records || []) {
          saved.push(await this.put(storeName, record));
        }
        return saved;
      },

      async get(storeName, id) {
        return clone(await transaction(storeName, "readonly", (store) => requestToPromise(store.get(id))));
      },

      async list(storeName) {
        return clone(await transaction(storeName, "readonly", (store) => requestToPromise(store.getAll())));
      },

      async delete(storeName, id) {
        await transaction(storeName, "readwrite", (store) => requestToPromise(store.delete(id)));
      },

      async clear(storeName) {
        await transaction(storeName, "readwrite", (store) => requestToPromise(store.clear()));
      }
    };
  }

  function createStorage(options) {
    const root = options && options.root || {};
    if (root.indexedDB) {
      return createIndexedDbAdapter({ indexedDB: root.indexedDB });
    }

    return createLocalStorageAdapter({
      storage: root.localStorage || options && options.storage,
      prefix: options && options.prefix
    });
  }

  return Object.freeze({
    DB_NAME,
    DB_VERSION,
    LOCAL_STORAGE_PREFIX,
    STORE_NAMES,
    STORE_SCHEMAS,
    clone,
    createIndexedDbAdapter,
    createLocalStorageAdapter,
    createRecordId,
    createStorage,
    nowIso
  });
});
