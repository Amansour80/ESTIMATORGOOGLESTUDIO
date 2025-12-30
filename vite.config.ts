import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-excel': ['exceljs'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-charts': ['gantt-task-react'],
          'vendor-flow': ['reactflow'],

          // Feature chunks - only load when needed
          'fm-estimator': [
            './src/pages/FMEstimator',
            './src/utils/fmDatabase',
            './src/utils/fmCalculations',
            './src/utils/fmDefaults',
          ],
          'retrofit-estimator': [
            './src/pages/RetrofitEstimator',
            './src/utils/retrofitDatabase',
            './src/utils/retrofitCalculations',
            './src/utils/retrofitDefaults',
          ],
          'retrofit-pm': [
            './src/pages/RetrofitPM',
            './src/pages/RetrofitPMWorkspace',
          ],
          'hk-estimator': [
            './src/utils/hkDatabase',
            './src/utils/calculations',
          ],
          'approvals': [
            './src/pages/Approvals',
            './src/utils/approvalDatabase',
            './src/components/ApprovalDashboard',
          ],
          'workflows': [
            './src/components/workflows/WorkflowCanvas',
            './src/components/workflows/WorkflowManager',
          ],
          'dashboards': [
            './src/pages/Dashboard',
            './src/pages/InteractiveDashboard',
            './src/utils/dashboardMetrics',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
