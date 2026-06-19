const api = Bun.spawn({
  cmd: ['bun', 'run', 'server/index.ts'],
  stdout: 'inherit',
  stderr: 'inherit',
});

const vite = Bun.spawn({
  cmd: ['bun', 'x', 'vite', '--host', '0.0.0.0'],
  stdout: 'inherit',
  stderr: 'inherit',
});

function stop() {
  api.kill();
  vite.kill();
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

await Promise.race([api.exited, vite.exited]);
stop();
