import preprocess from 'svelte-preprocess'
/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    package: {
      exports: (filepath) => filepath == 'index.js',
    },
  },

  preprocess: [
    preprocess({
      postcss: true,
    }),
  ],
}

export default config
