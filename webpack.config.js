const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const pages = ["task", "taskboard", "login"];
const publicDir = "dist";

module.exports = {
	entry: pages.reduce((config, page) => {
		config[page] = `./src/client/js/${page}.js`;
		return config;
	}, {}),
	output: {
		filename: "./[name]/[name].bundle.js",
		path: path.resolve(__dirname, publicDir),
	},
	mode: "none", // remove warning msg
	devtool: "inline-source-map",
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	// only using one type of plugin, so could remove this concat
	plugins: [].concat(
		pages.map(
			page =>
				new HtmlWebpackPlugin({
					inject: true, // default
					template: `./src/client/templates/${page}.html`,
					filename: `./${page}/index.html`,
					chunks: [page],
				})
		)
	),
};
