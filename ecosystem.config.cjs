const path = require('path')

module.exports = {
  apps: [
    {
      name: 'link-shortener',
      port: 7844,
      cwd: path.join(__dirname),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      script: './.output/server/index.mjs'
    }
  ]
}
