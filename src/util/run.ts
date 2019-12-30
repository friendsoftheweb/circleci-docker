import { exec } from 'child_process';

interface Options {
  stdin?: string;
  verbose?: boolean;
}

export default function run(
  command: string,
  options: Options = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const subprocess = exec(command, (error, stdout) => {
      if (error != null) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });

    if (options.verbose) {
      subprocess.stdout?.pipe(process.stdout);
    }

    if (options.stdin != null) {
      subprocess.stdin?.write(options.stdin);
      subprocess.stdin?.end();
    }
  });
}
