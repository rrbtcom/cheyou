module.exports = {
  apps: [{
    name: 'cheyou',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/cheyou',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
