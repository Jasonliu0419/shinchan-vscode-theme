import * as esbuild from 'esbuild';
const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const common = { bundle: true, minify: production, sourcemap: !production, logLevel: 'info' };
const options = [
  { ...common, entryPoints: ['src/extension/extension.ts'], outfile: 'dist/extension.js', platform: 'node', format: 'cjs', target: 'node20', external: ['vscode'] },
  { ...common, entryPoints: ['src/webview/main.ts'], outfile: 'dist/webview.js', platform: 'browser', format: 'iife', target: 'es2022' },
];
try {
  if (watch) {
    const contexts = await Promise.all(options.map(option => esbuild.context(option)));
    await Promise.all(contexts.map(context => context.watch()));
    const stop = async () => { await Promise.all(contexts.map(context => context.dispose())); process.exit(0); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  } else await Promise.all(options.map(option => esbuild.build(option)));
} catch (error) { console.error(error); process.exitCode = 1; }
