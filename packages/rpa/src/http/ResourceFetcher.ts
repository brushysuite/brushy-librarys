import axios from 'axios';
import { CacheManager } from '../cache/CacheManager';

export class ResourceFetcher {
  constructor(private cache: CacheManager) {}

  async fetch(url: string): Promise<string> {
    const cached = this.cache.get(url);
    if (cached) return cached.toString();
    const res = await axios.get(url);
    const data = res.data as string;
    this.cache.set(url, Buffer.from(data));
    return data;
  }
}
