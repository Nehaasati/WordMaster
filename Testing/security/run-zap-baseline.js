import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(scriptDir, 'results');
const sourceConfigPath = path.join(scriptDir, 'zap-baseline.conf');
const mountedConfigName = 'zap-baseline.conf';

const rawBaseUrl = process.env.BASE_URL || 'http://127.0.0.1:5024';
const baseUrl = rawBaseUrl.replace(/\/+$/, '');
const image = process.env.ZAP_IMAGE || 'ghcr.io/zaproxy/zaproxy:stable';
const strict = `${process.env.ZAP_STRICT || 'false'}`.toLowerCase() === 'true';

fs.mkdirSync(resultsDir, { recursive: true });
fs.copyFileSync(sourceConfigPath, path.join(resultsDir, mountedConfigName));

const args = [
  'run',
  '--rm',
  '-v',
  `${resultsDir}:/zap/wrk/:rw`,
  image,
  'zap-baseline.py',
  '-t',
  baseUrl,
  '-c',
  `/zap/wrk/${mountedConfigName}`,
  '-r',
  'zap-baseline-report.html',
  '-J',
  'zap-baseline-report.json',
  '-w',
  'zap-baseline-report.md',
];

if (!strict) {
  args.push('-I');
}

console.log(`Running ZAP baseline scan against ${baseUrl}`);
console.log(`Reports will be written to ${resultsDir}`);

const result = spawnSync('docker', args, {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
