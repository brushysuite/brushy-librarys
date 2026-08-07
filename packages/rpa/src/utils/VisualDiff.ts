import { createCanvas, loadImage } from 'canvas';
import pixelmatch from 'pixelmatch';

export async function compareScreenshots(img1: string | Buffer, img2: string | Buffer) {
  const [i1, i2] = await Promise.all([loadImage(img1), loadImage(img2)]);
  const width = Math.max(i1.width, i2.width);
  const height = Math.max(i1.height, i2.height);

  const canvas1 = createCanvas(width, height);
  const ctx1 = canvas1.getContext('2d');
  ctx1.drawImage(i1, 0, 0);
  const data1 = ctx1.getImageData(0, 0, width, height);

  const canvas2 = createCanvas(width, height);
  const ctx2 = canvas2.getContext('2d');
  ctx2.drawImage(i2, 0, 0);
  const data2 = ctx2.getImageData(0, 0, width, height);

  const diffCanvas = createCanvas(width, height);
  const diffCtx = diffCanvas.getContext('2d');
  const diffData = diffCtx.createImageData(width, height);
  const changed = pixelmatch(data1.data, data2.data, diffData.data, width, height);
  diffCtx.putImageData(diffData, 0, 0);
  const diffBuffer = diffCanvas.toBuffer('image/png');
  const percentageChanged = (changed / (width * height)) * 100;
  return { percentageChanged, diffImage: diffBuffer };
}
