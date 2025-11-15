import path from 'path';
import { fileURLToPath } from 'url';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: {
    'background/service-worker': './src/background/service-worker.ts',
    'content/content-script': './src/content/content-script.ts',
    'popup/popup': './src/popup/popup.ts',
    'options/options': './src/options/options.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/options/options.html', to: 'options/options.html' }
      ]
    })
  ],
  mode: 'production',
  devtool: 'source-map',
  // T094: Optimize bundle size (tree shaking, minification)
  optimization: {
    minimize: true,
    usedExports: true, // Tree shaking: mark unused exports
    sideEffects: false, // Enable tree shaking for entire modules
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Extract shared code into common chunk
        common: {
          name: 'shared',
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true
        },
        // Separate vendor dependencies
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 20,
          reuseExistingChunk: true
        }
      }
    }
  },
  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000, // 500KB
    maxAssetSize: 512000 // 500KB
  }
};

