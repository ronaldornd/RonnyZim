import { spawn } from 'child_process';

const test = async () => {
  const child = spawn('node', ['dist/market-intelligence/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  const send = (msg) => child.stdin.write(JSON.stringify(msg) + '\n');

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim().startsWith('{'));
    lines.forEach(line => {
      try {
        const msg = JSON.parse(line);
        console.log('RECV:', JSON.stringify(msg, null, 2));
        if (msg.id === 1) {
          // Initialized! Now call tool
          send({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'search_jobs',
              arguments: { query: 'Engenheiro Front-end Next.js Pleno' }
            }
          });
        } else if (msg.id === 2) {
          console.log('--- TEST RESULT ---');
          console.log(JSON.stringify(msg, null, 2));
          console.log('--- END TEST ---');
          child.kill();
          process.exit(0);
        }
      } catch (e) {
        console.error('JSON Parse Error:', e, line);
      }
    });
  });

  // Start Handshake
  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  });
};

test().catch(err => {
  console.error(err);
  process.exit(1);
});
