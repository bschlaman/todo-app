const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const pages = ["task", "taskboard"];
const pages_v2 = ["login", "task_v2"];
const publicDir = "dist";

module.exports = {
	entry: Object.assign(
		{},
		pages.reduce((config, page) => {
			config[page] = `./src/client/ts/${page}.ts`;
			return config;
		}, {}),
		{ login: `./src/client/pages/login/index.tsx` },
		{ task_v2: `./src/client/pages/task/index.tsx` }
	),
	resolve: {
		extensions: [".ts", ".tsx", ".js"],
	},
	output: {
		filename: "./[name]/[name].bundle.js",
		path: path.resolve(__dirname, publicDir),
	},
	mode: "development",
	devtool: "inline-source-map",
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	experiments: {
		topLevelAwait: true,
	},
	// only using one type of plugin, so could remove this concat
	plugins: []
		.concat(
			pages.map(
				page =>
					new HtmlWebpackPlugin({
						inject: true, // default
						template: `./src/client/templates/${page}.html`,
						filename: `./${page}/index.html`,
						chunks: [page],
					})
			)
		)
		.concat(
			pages_v2.map(
				page =>
					new HtmlWebpackPlugin({
						template: `./src/client/templates/root.html`,
						filename: `./${page}/index.html`,
						chunks: [page],
						title: `Todosky | ${page}`,
					})
			)
		),
};
