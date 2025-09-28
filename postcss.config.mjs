import postcssPresetMantine from 'postcss-preset-mantine';

const config = {
  plugins: [
    '@tailwindcss/postcss',
    postcssPresetMantine,
  ],
};

export default config;
