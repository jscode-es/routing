import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();

execSync('npm run build', { stdio: 'inherit', cwd: root });
const packOutput = execSync('npm pack --silent', { cwd: root })
  .toString()
  .trim()
  .split('\n');
const tarball = join(root, packOutput[packOutput.length - 1]);

const workDir = mkdtempSync(join(tmpdir(), 'routing-smoke-'));
try {
  execSync('npm init -y', { cwd: workDir, stdio: 'ignore' });
  execSync(`npm install --no-save "${tarball}"`, {
    cwd: workDir,
    stdio: 'inherit',
  });

  const require = createRequire(join(workDir, 'index.js'));

  // Entry principal: solo resolución (ejecutarlo requiere react-native).
  const mainPath = require.resolve('@jscode/react-native-routing');
  assert.ok(mainPath.endsWith('index.js'), `unexpected main entry ${mainPath}`);

  const pkgDir = join(workDir, 'node_modules', '@jscode', 'react-native-routing');
  assert.ok(
    existsSync(join(pkgDir, 'dist', 'index.d.ts')),
    'dist/index.d.ts missing from the tarball',
  );
  // Metro resuelve la condición react-native hacia src/.
  assert.ok(
    existsSync(join(pkgDir, 'src', 'index.ts')),
    'src/index.ts missing from the tarball',
  );

  // Helper de metro: JS plano, ejecutable en Node.
  const { withRouting } = require('@jscode/react-native-routing/metro');
  const config = withRouting({ transformer: { keepMe: true } });
  assert.equal(config.transformer.unstable_allowRequireContext, true);
  assert.equal(config.transformer.keepMe, true);

  console.log('smoke-pack: OK');
} finally {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(tarball, { force: true });
}
