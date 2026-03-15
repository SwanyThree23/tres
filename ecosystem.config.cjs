// ─────────────────────────────────────────────────────────────────────────────
// CY Live — PM2 Ecosystem Config  |  Cluster Mode + Log Rotate
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    {
      name: 'cylive-api',
      script: './apps/api/dist/index.js',
      instances: 'max',          // Cluster mode — uses all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      // Logging
      log_file: '/var/log/cylive/combined.log',
      out_file: '/var/log/cylive/out.log',
      error_file: '/var/log/cylive/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],

  // PM2 log-rotate module config
  // Install: pm2 install pm2-logrotate
  // pm2 set pm2-logrotate:max_size 50M
  // pm2 set pm2-logrotate:retain 30
  // pm2 set pm2-logrotate:compress true
  // pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
  // pm2 set pm2-logrotate:rotateModule true
};
