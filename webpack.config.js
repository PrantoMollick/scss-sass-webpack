const path = require("path");
const fs = require("fs");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const { extendDefaultPlugins } = require("svgo");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const inputTemplatePath = path.resolve(__dirname, "./src");
const outputTemplatePath = path.resolve(__dirname, "./dist");

const templateFiles = fs
  .readdirSync(inputTemplatePath)
  .filter((file) =>
    [".html", ".ejs"].includes(path.extname(file).toLowerCase())
  )
  .map((filename) => ({
    input: filename,
    output: filename.replace(/\.ejs$/, ".html"),
  }));

const htmlPluginEntries = templateFiles.map(
  (template) =>
    new HtmlWebpackPlugin({
      inject: true,
      hash: false,
      filename: template.output,
      template: path.join(inputTemplatePath, template.input),
      excludeChunks: [template.output === "about.html" ? "index" : ""],
    })
);

module.exports = {
  mode: "development",
  devtool: "source-map",

  entry: {
    index: path.resolve(__dirname, "./src/js/index.js"),
  },

  output: {
    clean: true,
    filename: "js/[name][hash:5].js",
    path: outputTemplatePath,
  },

  devServer: {
    static: {
      directory: outputTemplatePath,
      publicPath: "/",
      watch: true,
    },

    client: {
      overlay: true,
    },
    open: true,
    compress: true,
    hot: true,
    host: "127.0.0.1",
    port: 3000,
  },

  module: {
    rules: [
      {
        test: /\.(s|sc|c)ss$/i,
        //style loader inject css into javascript however minicss is make resources in one css file
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        type: "asset",
        generator: {
          filename: "images/[name].[hash:6][ext]",
        },
      },
    ],
  },

  optimization: {
    minimizer: [
      "...",
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ["gifsicle", { interlaced: true }],
              ["jpegtran", { progressive: true }],
              ["optipng", { optimizationLevel: 5 }],
              [
                "svgo",
                {
                  plugins: extendDefaultPlugins([
                    {
                      name: "removeViewBox",
                      active: false,
                    },
                    {
                      name: "addAttributesToSVGElement",
                      params: {
                        attributes: [{ xmlns: "http://www.w3.org/2000/svg" }],
                      },
                    },
                  ]),
                },
              ],
            ],
          },
        },
      }),
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(inputTemplatePath, "images"),
          to: path.resolve(outputTemplatePath, "images"),
          toType: "dir",
          globOptions: {
            ignore: ["*.DS_Store", "Thumbs.db"],
          },
		  noErrorOnMissing: true
        },
        // {
        //     from: path.resolve(environment.paths.source, 'videos'),
        //     to: path.resolve(environment.paths.output, 'videos'),
        //     toType: 'dir',
        //     globOptions: {
        //       ignore: ['*.DS_Store', 'Thumbs.db'],
        //     },
        // },
      ],
    }),
  ].concat(htmlPluginEntries),
};
