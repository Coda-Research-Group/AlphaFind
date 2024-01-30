import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
    ],
    test: {
        environment: 'jsdom',
        globals: true,
        setup: [
            "./tests/setup.ts",
        ]
    },
    base: "",
    build: {
        assetsDir: "static",
        rollupOptions: {
            output: {
                entryFileNames: "static/js/main.[hash].js",
                chunkFileNames: "static/js/[name].[hash].js",
                assetFileNames: (assetInfo) => {
                    const splittedFilename = assetInfo.name.split(".");
                    const extension = splittedFilename[splittedFilename.length - 1];

                    if (extension === "css")
                        return "static/css/main.[hash][extname]";

                    return "static/[name].[hash][extname]";
                },
            },
        },
        sourcemap: true,
    },
});
