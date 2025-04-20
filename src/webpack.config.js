var webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
    },
    experiments: {
      topLevelAwait: true,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
