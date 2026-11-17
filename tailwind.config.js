export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { ink: '#161a3d', paper: '#f5f4fa', brand: { 50: '#f1efff', 100: '#e4e0ff', 500: '#6d5bd0', 600: '#5b49bb', 700: '#4a3a9c' } },
    fontFamily: { sans: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'] } } },
  plugins: [],
};
