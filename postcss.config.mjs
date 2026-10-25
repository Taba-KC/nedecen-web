/**
 * CSS build pipeline configuration. Tailwind is processed here before styles reach the
 * browser; ordinary feature styles belong in their CSS modules.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
