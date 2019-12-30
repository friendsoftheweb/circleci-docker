import path from 'path';
import { readFileSync } from 'fs';

const packageFilePath = path.resolve(__dirname, '../../package.json');

export default function getPackageVersion(): string {
  const { version } = JSON.parse(readFileSync(packageFilePath).toString());

  return version;
}
