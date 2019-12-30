import path from 'path';
import { existsSync, readFileSync } from 'fs';

const pythonVersionFilePath = path.resolve(process.cwd(), 'runtime.txt');

export default function getPythonVersion(): string | null {
  if (!existsSync(pythonVersionFilePath)) {
    return null;
  }

  const version = readFileSync(pythonVersionFilePath)
    .toString()
    .replace(/^python-/, '')
    .replace(/\s+/g, '');

  if (/[^\d\.]/.test(version)) {
    throw new Error(`Invalid Python version: "${version}"`);
  }

  return version;
}
