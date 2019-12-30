import path from 'path';
import { existsSync, readFileSync } from 'fs';

const nodeVersionFilePath = path.resolve(process.cwd(), '.nvmrc');

export default function getNodeVersion(): string | null {
  if (!existsSync(nodeVersionFilePath)) {
    return null;
  }

  const version = readFileSync(nodeVersionFilePath)
    .toString()
    .replace(/\s+/g, '');

  if (/[^\d\.]/.test(version)) {
    throw new Error(`Invalid Node version: "${version}"`);
  }

  return version;
}
