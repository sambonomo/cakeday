// next.config.js
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ts$/,
      exclude: /functions/,
    });
    return config;
  },
};
