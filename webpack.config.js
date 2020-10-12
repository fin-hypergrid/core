const path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/Hypergrid/index.js",
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "lib"),
        library: 'hypergrid',
        libraryTarget: 'commonjs2',
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)$/,
                loader: "ts-loader",
                include: [
                    path.resolve(__dirname, "src"),
                    path.resolve(__dirname, "jsdoc"),
                    path.resolve(__dirname, "css"),
                    path.resolve(__dirname, "images"),
                ],
                options: {
                    configFile: path.resolve(__dirname, "tsconfig.json"),
                },
            },
        ],
    },
};
