const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];

function run(name, command, args, options = {}) {
    const child = spawn(command, args, {
        stdio: 'pipe',
        shell: false,
        ...options
    });

    children.push(child);

    child.stdout.on('data', (data) => {
        process.stdout.write(`[${name}] ${data}`);
    });

    child.stderr.on('data', (data) => {
        process.stderr.write(`[${name}] ${data}`);
    });

    child.on('exit', (code) => {
        const normalizedCode = code ?? 0;
        process.stdout.write(`[${name}] exited with code ${normalizedCode}\n`);
    });

    return child;
}

function shutdown() {
    children.forEach((child) => {
        if (!child.killed) {
            child.kill();
        }
    });
}

process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
});

run('backend', 'node', ['backend/server.js'], { cwd: process.cwd() });
run('frontend', npmCommand, ['run', 'dev', '--prefix', 'frontend'], { cwd: process.cwd() });
run('mcp', 'node', ['backend/mcp-server.js'], { cwd: process.cwd() });
