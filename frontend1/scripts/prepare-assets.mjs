import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('src/app/assets/fonts');
const target = path.resolve('src/static/fonts');
try {
  await access(source);
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true, force: true });
} catch {
  // The original font folder can be supplied by the project owner.
}
