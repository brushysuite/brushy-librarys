import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export class CacheManager {
  private dir: string;
  private ttl: number;

  constructor(dir = path.join(process.cwd(), '.cache'), ttl = 60_000) {
    this.dir = dir;
    this.ttl = ttl;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getPath(key: string) {
    const hash = crypto.createHash('sha1').update(key).digest('hex');
    return path.join(this.dir, hash);
  }

  get(key: string): Buffer | null {
    const file = this.getPath(key);
    if (!fs.existsSync(file)) return null;
    const { mtimeMs } = fs.statSync(file);
    if (Date.now() - mtimeMs > this.ttl) return null;
    return fs.readFileSync(file);
  }

  set(key: string, data: Buffer) {
    const file = this.getPath(key);
    fs.writeFileSync(file, data);
  }
}
