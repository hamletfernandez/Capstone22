// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		assetsInlineLimit: '2048',
        chunkSizeWarningLimit:500,
		rollupOptions: {
			output: {
				//Solve Warning: Some chunks are larger
				manualChunks(id) {
					if (id.includes('node_modules')) {
						return id.toString().split('node_modules/')[1].split('/')[0].toString();
					}
				}
			}
		}
	}
})