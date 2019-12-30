import path from 'path';
import { existsSync, readFileSync } from 'fs';

const rubyVersionFilePath = path.resolve(process.cwd(), '.ruby-version');

export default function getRubyVersion(): string | null {
  if (!existsSync(rubyVersionFilePath)) {
    return null;
  }

  const version = readFileSync(rubyVersionFilePath)
    .toString()
    .replace(/\s+/g, '');

  if (/[^\d\.]/.test(version)) {
    throw new Error(`Invalid Ruby version: "${version}"`);
  }

  return version;
}
