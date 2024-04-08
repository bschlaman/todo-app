const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const pages = ["task_v1", "taskboard"];
const pages_v2 = ["login", "task", "sprintboard"];
const publicDir = "dist";

module.exports = {
	mode: "development",
	devtool: "inline-source-map",
	entry: Object.assign(
		{},
		pages.reduce((config, page) => {
			config[page] = `./src/client/ts/${page}.ts`;
			return config;
		}, {}),
		pages_v2.reduce((config, page) => {
			config[page] = `./src/client/pages/${page}/index.tsx`;
			return config;
		}, {})
	),
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
				use: ["style-loader", "css-loader"],
			},
			{ // needed for katex/dist/katex.min.css
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
