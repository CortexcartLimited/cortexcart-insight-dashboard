module.exports = {
  apps: [
    {
      name: 'cortexcart-insight-dashboard',
      script: 'npm',
      args: 'start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,

        // Authentication
        NEXTAUTH_URL: 'YOUR_NEXTAUTH_URL',
        NEXTAUTH_SECRET: 'YOUR_NEXTAUTH_SECRET',

        // Google API Credentials
        GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
        GOOGLE_CLIENT_SECRET: 'YOUR_GOOGLE_CLIENT_SECRET',

        // Database
        DATABASE_URL: 'YOUR_DATABASE_URL',

        // Shopify API Credentials
        SHOPIFY_API_KEY: 'YOUR_SHOPIFY_API_KEY',
        SHOPIFY_API_SECRET: 'YOUR_SHOPIFY_API_SECRET',
        SHOPIFY_API_SCOPES: 'read_products,read_orders,read_analytics',
        SHOPIFY_REDIRECT_URI: 'YOUR_SHOPIFY_REDIRECT_URI',

        // Stripe API Credentials
        STRIPE_API_KEY: 'YOUR_STRIPE_API_KEY',
        STRIPE_WEBHOOK_SECRET: 'YOUR_STRIPE_WEBHOOK_SECRET',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'YOUR_STRIPE_PUBLISHABLE_KEY',

        // Resend API (for emails)
        RESEND_API_KEY: 'YOUR_RESEND_API_KEY',
        
        // Other services if any
        // e.g., SOME_OTHER_SERVICE_API_KEY: 'YOUR_KEY_HERE',
      },
    },
  ],

  // Deploy configuration (if you use pm2 deploy)
  deploy: {
    production: {
      // Example deploy config - adjust as needed
      user: 'YOUR_SSH_USER',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/main',
      repo: 'git@github.com:bespokedesignservices/cortexcart-insight-dashboard.git',
      path: '/path/to/your/app',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};