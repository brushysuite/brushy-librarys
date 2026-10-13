import { createCanvas, loadImage } from 'canvas';
import type { Window } from 'happy-dom';
import fs from 'node:fs';
import ffmpeg from 'ffmpeg-static';
import { spawn } from 'node:child_process';

export class RenderEngine {
  constructor(private window: Window) {}

  screenshot(path: string) {
    const { document } = this.window;
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.fillText(document.documentElement.outerHTML, 10, 20);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path, buffer);
  }

  async recordVideoStream(duration: number, fps: number, path: string) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ff = spawn(ffmpeg as unknown as string, [
      '-y',
      '-f', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-s', `${width}x${height}`,
      '-r', `${fps}`,
      '-i', '-',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      path
    ]);

    const ctx = canvas.getContext('2d');
    const start = Date.now();
    while (Date.now() - start < duration) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#000';
      ctx.fillText(this.window.document.documentElement.outerHTML, 10, 20);
      ff.stdin.write(canvas.toBuffer('raw')); // raw RGBA
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }
}
