import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/main.ts',
  output: [{
    name: 'MyLib',
    file: 'dist/myLib.js',
    format: 'iife',
    sourcemap: true
  }],
  plugins: [
    typescript({
      tsconfigDefaults: {
        sourcemap: true,
      },
    }),
  ]
}