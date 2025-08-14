import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import type { Config } from "postcss";

const config: Config = {
  plugins: {
    tailwindcss,
    autoprefixer,
  },
};

export default config;

