import path from 'path';
import { fileURLToPath } from 'url';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import TerserJsPlugin from 'terser-webpack-plugin';

/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable */
const isEnvProduction = process.env.NODE_ENV === 'production';
const isEnvDevelopment = process.env.NODE_ENV === 'development';

export const commonConfig = {
    devtool: isEnvDevelopment ? 'source-map' : false,
    mode: isEnvProduction ? 'production' : 'development',
    output: { path: path.join(__dirname, 'dist') },
    node: { __dirname: false, __filename: false },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/^\S+\/\S+\.js$/, (resource) => {
            // eslint-disable-next-line no-param-reassign
            resource.request = resource.request.replace(/\.js$/, '');
        }),
    ],
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        plugins: [
            new TsconfigPathsPlugin({
                configFile: './tsconfig.json',
                extensions: ['.js', '.json', '.ts', '.tsx'],
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.m?js/,
                resolve: { fullySpecified: false },
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                loader: 'esbuild-loader',
            },
            {
                test: /\.(less|scss|css)$/,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                strictMath: true,
                            },
                        },
                    },
                ],
            },
            {
                test: /\.(webp|webm|jpg|png|svg|ico|icns|mp3|gif)$/,
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]',
                },
            },
            {
                test: /\.node$/,
                loader: 'node-loader',
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserJsPlugin({
                minify: TerserJsPlugin.swcMinify,
                parallel: true,
                extractComments: 'all',
            }),
        ],
        removeAvailableModules: true,
        removeEmptyChunks: true,
        splitChunks: false,
    },
};
