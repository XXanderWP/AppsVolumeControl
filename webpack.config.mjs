import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { merge } from 'webpack-merge';
import { commonConfig } from './webpack.cfg.mjs';
/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable */

const mainConfig = merge(commonConfig, {
    entry: './src/backend/main.ts',
    target: 'electron-main',
    output: { filename: 'main.bundle.js' },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'package.json',
                    to: 'package.json',
                    transform: (content, _path) => {
                        const jsonContent = JSON.parse(content);
                        const electronVersion = jsonContent.devDependencies.electron;

                        delete jsonContent.devDependencies;
                        delete jsonContent.optionalDependencies;
                        delete jsonContent.scripts;
                        delete jsonContent.build;

                        jsonContent.main = './main.bundle.js';
                        jsonContent.scripts = { start: 'electron ./main.bundle.js' };
                        jsonContent.devDependencies = { electron: electronVersion };

                        return JSON.stringify(jsonContent, undefined, 2);
                    },
                },
            ],
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'logo.png',
                    to: 'logo.png',
                },
            ],
        }),
    ],
});

const preloadConfig = merge(commonConfig, {
    entry: './src/frontend/preload/preload.ts',
    target: 'electron-preload',
    output: { filename: 'preload.bundle.js' },
});

const rendererConfig = merge(commonConfig, {
    entry: './src/frontend/renderer/renderer.tsx',
    target: 'electron-renderer',
    output: { filename: 'renderer.bundle.js' },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './public/index.html'),
        }),
    ],

    devServer: {
        compress: true,
        port: 8888,
        host: '127.0.0.1',
    },
});

export default [
    mainConfig,
    preloadConfig,
    rendererConfig,
];
