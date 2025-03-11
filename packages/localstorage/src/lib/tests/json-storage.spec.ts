import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { JSONStorage } from "../json-storage";

describe("JSONStorage", () => {
  let storage: JSONStorage;

  beforeEach(() => {
    // Mock para console.error
    vi.spyOn(console, "error").mockImplementation(() => {});

    storage = new JSONStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("setJSON", () => {
    it("should set JSON data successfully", () => {
      const key = "testKey";
      const value = { name: "John", age: 30 };
      const options = { pretty: true };

      storage.setJSON(key, value, options);

      const storedValue = storage.getJSON(key);
      expect(storedValue).toEqual(value);
    });

    it("should throw an error on serialization failure", () => {
      const key = "testKey";
      // Criando um objeto circular para causar erro de serialização
      const value: any = { name: "John" };
      value.circularRef = value;

      expect(() => {
        storage.setJSON(key, value);
      }).toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[JSONStorage] Error serializing JSON:"),
        expect.any(Error),
      );
    });
  });

  describe("getJSON", () => {
    it("should get JSON data successfully", () => {
      const key = "testKey";
      const value = { name: "John", age: 30 };

      storage.setJSON(key, value);
      const retrievedValue = storage.getJSON(key);

      expect(retrievedValue).toEqual(value);
    });

    it("should return null for non-existent key", () => {
      const key = "nonExistentKey";

      const retrievedValue = storage.getJSON(key);

      expect(retrievedValue).toBeNull();
    });

    it("should return null on parsing failure", () => {
      const key = "testKey";
      const invalidJSON = "{ invalid: JSON }";

      storage.set(key, invalidJSON);
      const retrievedValue = storage.getJSON(key);

      expect(retrievedValue).toBeNull();
    });
  });

  describe("updateJSON", () => {
    it("should update JSON data successfully", () => {
      const key = "testKey";
      const initialValue = { name: "John", age: 30 };
      const updates = { age: 31 };

      storage.setJSON(key, initialValue);
      const updatedValue = storage.updateJSON(key, updates);

      expect(updatedValue).toEqual({ ...initialValue, ...updates });
    });

    it("should return null for non-existent key", () => {
      const key = "nonExistentKey";
      const updates = { age: 31 };

      const updatedValue = storage.updateJSON(key, updates);

      expect(updatedValue).toBeNull();
    });

    it("should handle errors when updating JSON", () => {
      const key = "errorKey";

      // Mockando getJSON para lançar um erro
      vi.spyOn(storage, "getJSON").mockImplementationOnce(() => {
        throw new Error("Erro ao obter JSON");
      });

      const result = storage.updateJSON(key, { name: "Updated" });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[JSONStorage] Error updating JSON:"),
        expect.any(Error),
      );
    });
  });

  describe("mergeArrays", () => {
    it("should merge arrays successfully", () => {
      const key = "testKey";
      const initialArray = [1, 2, 3];
      const newItems = [3, 4, 5];

      storage.setJSON(key, initialArray);
      const mergedArray = storage.mergeArrays(key, newItems);

      expect(mergedArray).toEqual([1, 2, 3, 3, 4, 5]);
    });

    it("should merge arrays with unique items", () => {
      const key = "testKey";
      const initialArray = [1, 2, 3];
      const newItems = [3, 4, 5];

      storage.setJSON(key, initialArray);
      const mergedArray = storage.mergeArrays(key, newItems, { unique: true });

      expect(mergedArray).toEqual([1, 2, 3, 4, 5]);
    });

    it("should merge arrays with unique items using a comparator", () => {
      const key = "testKey";
      const initialArray = [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ];
      const newItems = [
        { id: 2, name: "Jane Doe" },
        { id: 3, name: "Bob" },
      ];

      storage.setJSON(key, initialArray);
      const mergedArray = storage.mergeArrays(key, newItems, {
        unique: true,
        comparator: (a, b) => a.id === b.id,
      });

      expect(mergedArray).toEqual([
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
        { id: 3, name: "Bob" },
      ]);
    });

    it("should return the new items on merge failure", () => {
      const key = "testKey";
      const invalidJSON = "{ invalid: JSON }";
      const newItems = [1, 2, 3];

      storage.set(key, invalidJSON);
      const mergedArray = storage.mergeArrays(key, newItems);

      expect(mergedArray).toEqual([1, 2, 3]);
    });

    it("should handle errors when merging arrays", () => {
      const key = "errorKey";

      // Mockando getJSON para lançar um erro
      vi.spyOn(storage, "getJSON").mockImplementationOnce(() => {
        throw new Error("Erro ao obter JSON");
      });

      const result = storage.mergeArrays(key, [1, 2, 3]);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[JSONStorage] Error merging arrays:"),
        expect.any(Error),
      );
    });
  });

  describe("isValidJSON", () => {
    it("should return true for valid JSON", () => {
      const key = "testKey";
      const validJSON = '{"name":"John","age":30}';

      storage.set(key, validJSON);
      const isValid = storage.isValidJSON(key);

      expect(isValid).toBe(true);
    });

    it("should return false for invalid JSON", () => {
      const key = "testKey";
      const invalidJSON = "{ invalid: JSON }";

      storage.set(key, invalidJSON);
      const isValid = storage.isValidJSON(key);

      expect(isValid).toBe(false);
    });

    it("should return false for non-existent key", () => {
      const key = "nonExistentKey";

      const isValid = storage.isValidJSON(key);

      expect(isValid).toBe(false);
    });
  });

  describe("getJSONSchema", () => {
    it("should return the correct schema for a simple object", () => {
      const key = "testKey";
      const value = { name: "John", age: 30 };

      storage.setJSON(key, value);
      const schema = storage.getJSONSchema(key);

      expect(schema).toEqual({
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      });
    });

    it("should return the correct schema for a nested object", () => {
      const key = "testKey";
      const value = {
        name: "John",
        address: {
          street: "123 Main St",
          city: "Anytown",
          country: "USA",
        },
      };

      storage.setJSON(key, value);
      const schema = storage.getJSONSchema(key);

      expect(schema).toEqual({
        type: "object",
        properties: {
          name: { type: "string" },
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
              country: { type: "string" },
            },
          },
        },
      });
    });

    it("should return the correct schema for an array", () => {
      const key = "testKey";
      const value = [1, 2, 3];

      storage.setJSON(key, value);
      const schema = storage.getJSONSchema(key);

      expect(schema).toEqual({
        type: "array",
        items: { type: "number" },
      });
    });

    it("should return null for non-existent key", () => {
      const key = "nonExistentKey";

      const schema = storage.getJSONSchema(key);

      expect(schema).toBeNull();
    });

    it("should return null on schema generation failure", () => {
      const key = "testKey";
      const invalidJSON = "{ invalid: JSON }";

      storage.set(key, invalidJSON);
      const schema = storage.getJSONSchema(key);

      expect(schema).toBeNull();
    });

    it("should handle errors when getting JSON schema", () => {
      const key = "errorKey";

      // Mockando getJSON para lançar um erro
      vi.spyOn(storage, "getJSON").mockImplementationOnce(() => {
        throw new Error("Erro ao obter JSON");
      });

      const result = storage.getJSONSchema(key);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[JSONStorage] Error getting JSON schema:"),
        expect.any(Error),
      );
    });

    it("should generate schema for array with no items", () => {
      const key = "emptyArrayKey";
      const emptyArray: any[] = [];

      storage.setJSON(key, emptyArray);
      const schema = storage.getJSONSchema(key);

      expect(schema).toEqual({
        type: "array",
        items: undefined,
      });
    });

    it("should generate schema for null values", () => {
      const key = "nullValueKey";
      const data = {
        nullField: null,
        regularField: "test",
      };

      storage.setJSON(key, data);
      const schema = storage.getJSONSchema(key);

      expect(schema).toEqual({
        type: "object",
        properties: {
          nullField: { type: "null" },
          regularField: { type: "string" },
        },
      });
    });
  });
});
