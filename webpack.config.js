const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const sveltePreprocess = require('svelte-preprocess')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const WebpackVersionFilePlugin = require('webpack-version-file-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const mode = process.env.NODE_ENV || 'development'
const prod = mode === 'production'
const dev = !prod

const publicPath = '/'

module.exports = {
  entry: {
    bundle: ['./src/main.ts'],
  },
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte'),
      src: path.resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.svelte', '.ts'],
    mainFields: ['svelte', 'browser', 'module', 'main'],
    // fallback: {
    //   fs: require.resolve('fs'),
    //   path: require.resolve('path'),
    //   crypto: require.resolve('crypto'),
    // },
  },
  output: {
    path: __dirname + '/public',
    publicPath,
    filename: '[contenthash].js',
    chunkFilename: '[contenthash].js',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader-hot',
          options: {
            dev,
            hotReload: true,
            hotOptions: {
              // whether to preserve local state (i.e. any `let` variable) or
              // only public props (i.e. `export let ...`)
              noPreserveState: false,
              // optimistic will try to recover from runtime errors happening
              // during component init. This goes funky when your components are
              // not pure enough.
              optimistic: true,

              // See docs of svelte-loader-hot for all available options:
              //
              // https://github.com/rixo/svelte-loader-hot#usage
            },

            preprocess: sveltePreprocess({
              typescript: {
                transpileOnly: true,
                tsconfigFile: './tsconfig.json',
              },
            }),
          },
        },
      },

      {
        test: /\.css$/,
        use: [
          /**
           * MiniCssExtractPlugin doesn't support HMR.
           * For developing, use 'style-loader' instead.
           * */
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },

      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },

      {
        test: /\.css$/,
        use: [
          /**
           * MiniCssExtractPlugin doesn't support HMR.
           * For developing, use 'style-loader' instead.
           * */
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          'postcss-loader',
          'css-loader',
        ],
      },

      {
        test: /\.styl$/,
        use: [
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
          {
            loader: 'stylus-loader',
            options: {
              webpackImporter: false,
            },
          },
        ],
      },

      {
        test: /\.(png|jpe?g|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[contenthash][ext][query]',
        },
      },

      {
        test: /\.(woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[contenthash][ext][query]',
        },
      },

      {
        test: /\.svg$/,
        type: 'asset/source',
      },

      {
        resourceQuery: /raw/,
        type: 'asset/source',
      },
    ],
  },
  optimization: {
    minimizer: [`...`, new CssMinimizerPlugin()],
  },
  mode,
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[contenthash].css',
    }),

    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['**/*', '!version.json'],
    }),

    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'assets', 'public', 'index.html'),
      publicPath,
    }),

    new WebpackVersionFilePlugin({
      packageFile: path.join(__dirname, 'package.json'),
      template: path.join(__dirname, 'version.ejs'),
      outputFile: path.join(__dirname, 'public', 'version.json'),
      extras: {
        buildTime: new Date().toString(),
      },
    }),

    new CopyPlugin({
      patterns: [
        // {
        //   from: 'src/assets/data/web_model',
        //   to: 'web_model',
        // },
        // {
        //   from: 'src/assets/data/yolov5s_web_model',
        //   to: 'yolov5s_web_model',
        // },
        // {
        //   from: 'src/assets/data/yolov5x_web_model',
        //   to: 'yolov5x_web_model',
        // },
      ],
    }),
  ],
  devtool: prod ? false : 'source-map',
  devServer: {
    hot: true,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
      progress: true,
      logging: 'error',
    },
    port: 8080,
    host: '0.0.0.0',
    // https: true,
    // historyApiFallback: {
    //   rewrites: [
    //     { from: /version\.json/, to: `/version.json` },
    //     { from: /./, to: `${publicPath}/` },
    //   ],
    // },
    allowedHosts: 'all',
  },
}
