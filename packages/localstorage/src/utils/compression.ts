import { compress, decompress } from "lz-string";
import { CompressionOptions, DataType } from "../core/types";

export class TypedCompression {
  private static readonly DEFAULT_THRESHOLD = 1024; // 1KB
  private static readonly CHUNK_SIZE = 8192; // 8KB

  /**
   * Detects the primary data type of a value for optimized compression
   */
  private static detectType(value: any): DataType {
    if (typeof value === "string") {
      // Check if string is base64
      if (/^[A-Za-z0-9+/=]+$/.test(value)) return "binary";
      return "string";
    }
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "date";
    if (typeof value === "number") return "number";
    return "object";
  }

  /**
   * Compresses data based on its type and size
   */
  static compressData(data: any, options: CompressionOptions = {}): string {
    const type = this.detectType(data);
    const threshold = options.threshold || this.DEFAULT_THRESHOLD;

    // Convert to string first to check size
    const stringData = JSON.stringify(data);
    if (stringData.length < threshold) return stringData;

    const compressionMethods: Record<DataType, () => string> = {
      string: () => this.compressString(stringData, options),
      array: () => this.compressArray(data, options),
      binary: () => this.compressBinary(stringData),
      object: () => this.compressObject(data, options),
      number: () => compress(stringData),
      date: () => compress(stringData),
    };

    return compressionMethods[type]?.() ?? compress(stringData);
  }

  /**
   * Decompresses data based on the stored format
   */
  static decompressData(data: string): any {
    try {
      // First try parsing as regular JSON
      return JSON.parse(data);
    } catch {
      try {
        // Try decompressing
        const decompressed = decompress(data);
        if (!decompressed) return null;

        // Check if it's a chunked format
        if (decompressed.startsWith("__CHUNKED__")) {
          return this.decompressChunked(decompressed);
        }

        return JSON.parse(decompressed);
      } catch {
        return null;
      }
    }
  }

  /**
   * Optimized string compression
   */
  private static compressString(
    data: string,
    options: CompressionOptions,
  ): string {
    if (options.mode === "aggressive") {
      // For aggressive mode, use chunked compression
      return this.compressChunked(data);
    }
    return compress(data);
  }

  /**
   * Optimized array compression with chunking for large arrays
   */
  private static compressArray(
    data: any[],
    options: CompressionOptions,
  ): string {
    if (data.length > 1000 || options.mode === "aggressive") {
      // For large arrays, compress in chunks
      const chunks = this.chunkArray(data, this.CHUNK_SIZE);
      const compressedChunks = chunks.map((chunk) =>
        compress(JSON.stringify(chunk)),
      );
      return `__CHUNKED__${JSON.stringify(compressedChunks)}`;
    }
    return compress(JSON.stringify(data));
  }

  /**
   * Optimized binary data compression
   */
  private static compressBinary(data: string): string {
    // Binary data is already compressed, just return as is
    return data;
  }

  /**
   * Optimized object compression with selective field compression
   */
  private static compressObject(
    data: object,
    options: CompressionOptions,
  ): string {
    if (options.mode === "aggressive") {
      // In aggressive mode, compress large fields individually
      const compressed: Record<string, any> = {};

      for (const [key, value] of Object.entries(data)) {
        const stringValue = JSON.stringify(value);
        if (stringValue.length > this.DEFAULT_THRESHOLD) {
          compressed[key] = compress(stringValue);
        } else {
          compressed[key] = value;
        }
      }

      return `__SELECTIVE__${compress(JSON.stringify(compressed))}`;
    }

    return compress(JSON.stringify(data));
  }

  /**
   * Chunks array into smaller pieces for efficient compression
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Compresses large data in chunks
   */
  private static compressChunked(data: string): string {
    const chunks = this.chunkArray(data.split(""), this.CHUNK_SIZE)
      .map((chunk) => chunk.join(""))
      .map((chunk) => compress(chunk));

    return `__CHUNKED__${JSON.stringify(chunks)}`;
  }

  /**
   * Decompresses chunked data
   */
  private static decompressChunked(data: string): any {
    const chunksData = data.replace("__CHUNKED__", "");
    const chunks: string[] = JSON.parse(chunksData);

    const decompressedChunks = chunks.map((chunk) => decompress(chunk));
    const result = decompressedChunks.join("");

    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
}
