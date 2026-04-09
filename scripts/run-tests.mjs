import { execSync } from 'child_process';

try {
  const result = execSync('npx vitest run --reporter=verbose', {
    cwd: '/vercel/share/v0-project',
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(result);
} catch (error) {
  console.log(error.stdout || '');
  console.log(error.stderr || '');
  process.exit(error.status || 1);
}
