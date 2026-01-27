import path from "path";
import type webpack from "webpack";
// needed when declaring a `devServer`
import "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";

const pages_v2 = ["login", "task", "sprintboard", "stories"];
const publicDir = "dist";

export default {
  mode: "development",
  devtool: "inline-source-map",
  entry: pages_v2.reduce(
    (cfg, page) => {
      cfg[page] = `./src/client/pages/${page}/index.tsx`;
      return cfg;
    },
    {} as Record<string, string>,
  ),
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  output: {
    // [contenthash] to prevent caching when I make changes
    filename: "./[name]/[name].[contenthash].bundle.js",
    path: path.resolve(import.meta.dirname, publicDir),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        include: path.resolve(import.meta.dirname, "src", "client"),
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        // needed for katex/dist/katex.min.css
        test: /\.css$/i,
        include: path.resolve(import.meta.dirname, "node_modules/katex/dist"),
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.([cm]?ts|tsx)$/,
        use: {
          loader: "ts-loader",
          //         webpack bundle determines include/exclude, not tsconfig.json
          options: { onlyCompileBundledFiles: true },
        },
        include: path.resolve(import.meta.dirname, "src", "client"),
        exclude: /node_modules/,
      },
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
  plugins: [
    ...pages_v2.map(
      (page) =>
        new HtmlWebpackPlugin({
          template: `./src/client/templates/root.html`,
          filename: `./${page}/index.html`,
          chunks: [page],
          title: `Todosky | ${page}`,
          // publicPath = "/" is needed for all SPA pages.
          // this is because we leave URIs like /stories/story/xyz intact,
          // so the browser is unable to resolve the relative <script> path in index.html correctly.
          publicPath: page === "stories" ? "/" : "auto",
        }),
    ),
  ],
  devServer: {
    allowedHosts: ["all"],
    client: {
      progress: true,
      overlay: false, // TODO: set this to true once I can
    },
    historyApiFallback: {
      rewrites: [
        { from: /^\/task/, to: "/task" },
        { from: /^\/stories(\/.*)?$/, to: "/stories" },
      ],
    },
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:8081",
      },
    ],
    watchFiles: ["src/client/**/*"],
    static: {
      directory: path.resolve(import.meta.dirname, "dist"),
    },
  },
} satisfies webpack.Configuration;
