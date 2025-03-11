import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LazyStorage } from "../lazy-storage";
import { TypedCompression } from "../../utils/compression";
import { JSONStorage } from "../json-storage";

// Mock correto do TypedCompression
vi.mock("../../utils/compression", () => ({
  TypedCompression: {
    compressData: vi.fn((data) => JSON.stringify(data)),
    decompressData: vi.fn((data) => {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }),
  },
}));

describe("LazyStorage", () => {
  let storage: LazyStorage;

  beforeEach(() => {
    // Mock para console.error
    vi.spyOn(console, "error").mockImplementation(() => {});

    localStorage.clear();
    storage = new LazyStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with the correct prefix", () => {
      const customStorage = new LazyStorage("@custom/prefix:");
      expect(customStorage).toBeInstanceOf(LazyStorage);
    });
  });

  describe("setLazy", () => {
    it("should set lazy data without compression", () => {
      const key = "testKey";
      const value = { name: "John", age: 30, hobbies: ["reading", "swimming"] };
      const options = { lazyFields: ["hobbies"], chunkSize: 2 };

      storage.setLazy(key, value, options);

      expect(storage.get(key)).toBeDefined();
      expect(TypedCompression.compressData).not.toHaveBeenCalled();
    });

    it("should set lazy data with compression", () => {
      const key = "testKey";
      const value = { name: "John", age: 30, hobbies: ["reading", "swimming"] };
      const options = {
        lazyFields: ["hobbies"],
        compression: {
          mode: "auto" as const,
          threshold: 1024,
        },
      };

      storage.setLazy(key, value, options);

      expect(storage.get(key)).toBeDefined();
      expect(TypedCompression.compressData).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John",
          age: 30,
          hobbies: expect.any(Object),
        }),
        { mode: "auto", threshold: 1024 },
      );
    });
  });

  describe("getLazy", () => {
    it("should get lazy data without preloading", () => {
      const key = "testKey";
      const value = { name: "John", age: 30, hobbies: ["reading", "swimming"] };
      storage.setLazy(key, value, { lazyFields: ["hobbies"] });

      const result = storage.getLazy<any>(key);

      expect(result).toEqual(
        expect.objectContaining({
          name: "John",
          age: 30,
        }),
      );
      expect(result.hobbies).toEqual(["reading", "swimming"]);
    });

    it("should get lazy data with preloading", () => {
      const key = "testKey";
      const value = { name: "John", age: 30, hobbies: ["reading", "swimming"] };
      storage.setLazy(key, value, { lazyFields: ["hobbies"] });

      const result = storage.getLazy<any>(key, { preloadFields: ["hobbies"] });

      expect(result).toEqual(
        expect.objectContaining({
          name: "John",
          age: 30,
        }),
      );
      expect(result.hobbies).toEqual(["reading", "swimming"]);
    });

    it("should return null for non-existent key", () => {
      const key = "nonExistentKey";

      const result = storage.getLazy(key);

      expect(result).toBeNull();
    });

    it("should handle compressed data", () => {
      const key = "testKey";
      const value = { name: "John", age: 30, hobbies: ["reading", "swimming"] };
      storage.setLazy(key, value, {
        lazyFields: ["hobbies"],
        compression: {
          mode: "auto" as const,
          threshold: 1024,
        },
      });

      const result = storage.getLazy<any>(key);

      expect(result).toEqual(
        expect.objectContaining({
          name: "John",
          age: 30,
        }),
      );
      expect(result.hobbies).toEqual(["reading", "swimming"]);
      expect(TypedCompression.decompressData).toHaveBeenCalled();
    });

    it("should handle errors when getting lazy value", () => {
      const key = "errorKey";

      // Mock do console.error antes de chamar o método que vai usá-lo
      const consoleSpy = vi.spyOn(console, "error");

      // Mock do método get do JSONStorage (classe pai)
      vi.spyOn(JSONStorage.prototype, "get").mockImplementationOnce(() => {
        throw new Error("Erro ao obter valor");
      });

      const result = storage.getLazy(key);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      // Restaurar o mock
      consoleSpy.mockRestore();
    });
  });

  describe("processLazyFields", () => {
    it("should process lazy fields for arrays", () => {
      const key = "testKey";
      const value = {
        name: "John",
        hobbies: ["reading", "swimming", "coding"],
      };
      const lazyFields = ["hobbies"];
      const chunkSize = 2;

      const result = (storage as any).processLazyFields(
        key,
        value,
        lazyFields,
        chunkSize,
      );

      expect(result).toEqual({
        name: "John",
        hobbies: {
          __lazy: true,
          type: "array",
          chunks: expect.any(Array),
          total: 3,
        },
      });
    });

    it("should process lazy fields for objects", () => {
      const key = "testKey";
      const value = {
        name: "John",
        address: { street: "123 Main St", city: "Anytown" },
      };
      const lazyFields = ["address"];

      const result = (storage as any).processLazyFields(
        key,
        value,
        lazyFields,
        50,
      );

      expect(result).toEqual({
        name: "John",
        address: {
          __lazy: true,
          type: "object",
          key: `${key}:address`,
        },
      });
    });

    it("should not process non-existent fields", () => {
      const key = "testKey";
      const value = { name: "John" };
      const lazyFields = ["nonExistentField"];

      const result = (storage as any).processLazyFields(
        key,
        value,
        lazyFields,
        50,
      );

      expect(result).toEqual({ name: "John" });
    });
  });

  describe("createLazyProxy", () => {
    it("should create a lazy proxy for lazy fields", () => {
      const key = "testKey";
      const data = {
        name: "John",
        hobbies: {
          __lazy: true,
          type: "array",
          chunks: ["testKey:hobbies:0"],
          total: 2,
        },
      };

      // Mock do método getJSON para retornar os dados do chunk quando solicitado
      vi.spyOn(JSONStorage.prototype, "getJSON")
        .mockImplementationOnce((k) => {
          if (k === "testKey") {
            return data;
          }
          return null;
        })
        .mockImplementationOnce((k) => {
          if (k === "testKey:hobbies:0") {
            return ["reading", "swimming"];
          }
          return null;
        });

      // Criar o proxy diretamente usando o método privado
      const proxy = (storage as any).createLazyProxy(key, data);

      // Acessar a propriedade lazy para acionar o getter do proxy
      const hobbies = proxy.hobbies;

      expect(proxy.name).toBe("John");
      expect(hobbies).toEqual(["reading", "swimming"]);
    });

    it("should return non-lazy fields directly", () => {
      const key = "testKey";
      const data = { name: "John", age: 30 };

      const proxy = (storage as any).createLazyProxy(key, data);

      expect(proxy.name).toBe("John");
      expect(proxy.age).toBe(30);
    });
  });

  describe("loadLazyField", () => {
    it("should load lazy array field", () => {
      const key = "testKey";
      const value = {
        name: "John",
        hobbies: ["reading", "swimming", "coding"],
      };
      storage.setLazy(key, value, { lazyFields: ["hobbies"], chunkSize: 2 });

      const result = (storage as any).loadLazyField(key, "hobbies");

      expect(result).toEqual(["reading", "swimming", "coding"]);
    });

    it("should load lazy object field", () => {
      const key = "testKey";
      const value = {
        name: "John",
        address: { street: "123 Main St", city: "Anytown" },
      };
      storage.setLazy(key, value, { lazyFields: ["address"] });

      const result = (storage as any).loadLazyField(key, "address");

      expect(result).toEqual({ street: "123 Main St", city: "Anytown" });
    });

    it("should return undefined for non-lazy field", () => {
      const key = "testKey";
      const value = { name: "John", age: 30 };
      storage.setLazy(key, value, {});

      const result = (storage as any).loadLazyField(key, "age");

      expect(result).toBeUndefined();
    });

    it("should handle unknown lazy field types", () => {
      const key = "testKey";
      const data = {
        field: {
          __lazy: true,
          type: "unknown", // Tipo desconhecido
          key: "testKey:field",
        },
      };

      // Mock do getJSON para retornar os dados
      vi.spyOn(JSONStorage.prototype, "getJSON").mockImplementationOnce(
        () => data,
      );

      // Chamar o método privado loadLazyField
      const result = (storage as any).loadLazyField(key, "field");

      // Deve retornar undefined para tipos desconhecidos
      expect(result).toBeUndefined();
    });
  });

  describe("chunkArray", () => {
    it("should chunk an array correctly", () => {
      const array = [1, 2, 3, 4, 5];
      const size = 2;

      const result = (storage as any).chunkArray(array, size);

      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("should handle empty array", () => {
      const array: number[] = [];
      const size = 2;

      const result = (storage as any).chunkArray(array, size);

      expect(result).toEqual([]);
    });
  });

  describe("preload", () => {
    it("should preload specified fields", () => {
      const key = "testKey";
      const value = {
        name: "John",
        hobbies: ["reading", "swimming", "coding"],
      };
      storage.setLazy(key, value, { lazyFields: ["hobbies"] });

      storage.preload(key, ["hobbies"]);

      const result = storage.getLazy<any>(key);
      expect(result.hobbies).toEqual(["reading", "swimming", "coding"]);
    });

    it("should not preload non-existent fields", () => {
      const key = "testKey";
      const value = { name: "John" };
      storage.setLazy(key, value, {});

      storage.preload(key, ["nonExistentField"]);

      const result = storage.getLazy<any>(key);
      expect(result).toEqual({ name: "John" });
    });
  });

  describe("clearCache", () => {
    it("should clear the cache", () => {
      const key = "testKey";
      const value = {
        name: "John",
        hobbies: ["reading", "swimming", "coding"],
      };
      storage.setLazy(key, value, { lazyFields: ["hobbies"] });

      const before = storage.getLazy<any>(key);
      expect(before.hobbies).toEqual(["reading", "swimming", "coding"]);

      storage.clearCache();

      const after = storage.getLazy<any>(key);
      expect(after.hobbies).toEqual(["reading", "swimming", "coding"]);
    });
  });
});
