const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const pages_v2 = ["login", "task", "sprintboard", "stories"];
const publicDir = "dist";

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: pages_v2.reduce((config, page) => {
    config[page] = `./src/client/pages/${page}/index.tsx`;
    return config;
  }, {}),
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  output: {
    filename: "./[name]/[name].bundle.js",
    path: path.resolve(__dirname, publicDir),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        include: path.resolve(__dirname, "src", "client"),
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        // needed for katex/dist/katex.min.css
        test: /\.css$/i,
        include: path.resolve(__dirname, "node_modules/katex/dist"),
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        include: path.resolve(__dirname, "src", "client"),
        exclude: /node_modules/,
      },
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
  plugins: [].concat(
    pages_v2.map(
      (page) =>
        new HtmlWebpackPlugin({
          template: `./src/client/templates/root.html`,
          filename: `./${page}/index.html`,
          chunks: [page],
          title: `Todosky | ${page}`,
        }),
    ),
    [
      // new HtmlWebpackPlugin({
      //   template: `./src/client/templates/root.html`,
      //   filename: `./stories/index.html`,
      //   chunks: ["stories"],
      //   title: `Todosky | stories`,
      // }),
    ],
  ),
  devServer: {
    allowedHosts: ["all"],
    client: {
      progress: true,
      overlay: false, // TODO: set this to true once I can
    },
    historyApiFallback: {
      rewrites: [{ from: /^\/task/, to: "/task" }],
    },
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:8081",
      },
    ],
    watchFiles: ["src/client/**/*"],
    static: {
      directory: path.resolve(__dirname, "dist"),
    },
  },
};
