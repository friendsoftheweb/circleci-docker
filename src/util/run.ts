import { exec } from 'child_process';

interface Options {
  stdin?: string;
}

export default function run(
  command: string,
  options: Options = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = exec(command, (error, stdout) => {
      if (error != null) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });

    if (options.stdin != null) {
      process.stdin?.write(options.stdin);
      process.stdin?.end();
    }
  });
}
