import { spawn } from 'child_process';
import { JSONRPCClient } from 'json-rpc-2.0';

async function test() {
  const server = spawn('node', ['dist/market-intelligence/index.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'inherit']
  });

  const client = new JSONRPCClient((request) => {
    server.stdin.write(JSON.stringify(request) + '\n');
    return Promise.resolve();
  });

  server.stdout.on('data', (data) => {
    const responses = data.toString().split('\n').filter(Boolean);
    responses.forEach(res => {
      try {
        client.receive(JSON.parse(res));
      } catch (e) {}
    });
  });

  console.log("Calling search_jobs...");
  try {
    const result = await client.request('callTool', {
      name: 'search_jobs',
      arguments: { query: 'Engenheiro Front-end Next.js Pleno' }
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    server.kill();
  }
}

test();
