import copy from 'rollup-plugin-copy';
import postcss from 'rollup-plugin-postcss';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'extension/src/popup.js',
  output: {
    file: 'extension/dist/popup.js',
    format: 'iife',
  },
  plugins: [
    postcss({
      extract: true,
      minimize: true,
    }),
    nodeResolve({
      jsnext: true,
    }),
    commonjs(),
    copy({
      "extension/src/background.js": "extension/dist/background.js",
      verbose: true
    }),
  ],
};