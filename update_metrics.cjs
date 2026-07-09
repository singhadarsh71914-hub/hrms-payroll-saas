const fs = require('fs');
let text = fs.readFileSync('src/services/metrics.service.ts', 'utf8');

const newMetrics = `
export const intelligenceSnapshotsTotal = new promClient.Counter({ name: 'intelligence_snapshots_total', help: 'Total intelligence snapshots created', labelNames: ['type', 'company_id'] });
export const burnoutPredictionsTotal = new promClient.Counter({ name: 'burnout_predictions_total', help: 'Total burnout predictions made' });
export const attritionPredictionsTotal = new promClient.Counter({ name: 'attrition_predictions_total', help: 'Total attrition predictions made' });
export const anomaliesDetectedTotal = new promClient.Counter({ name: 'anomalies_detected_total', help: 'Total anomalies detected', labelNames: ['type', 'severity'] });
export const featureStoreReadsTotal = new promClient.Counter({ name: 'feature_store_reads_total', help: 'Total feature store reads', labelNames: ['type', 'company_id'] });
`;

text = text.replace('export const MetricsService = {', newMetrics + '\nexport const MetricsService = {');

// Add to MetricsService object
const methods = `
    increment: (metric: string, labels?: Record<string, string>) => {
      switch(metric) {
        case 'intelligence_snapshots_total': intelligenceSnapshotsTotal.labels(labels || {}).inc(); break;
        case 'burnout_predictions_total': burnoutPredictionsTotal.inc(); break;
        case 'attrition_predictions_total': attritionPredictionsTotal.inc(); break;
        case 'anomalies_detected_total': anomaliesDetectedTotal.labels(labels || {}).inc(); break;
        case 'feature_store_reads_total': featureStoreReadsTotal.labels(labels || {}).inc(); break;
      }
    },
    recordHistogram: (metric: string, val: number) => {
      // just a placeholder if needed
    },`;

text = text.replace('export const MetricsService = {', 'export const MetricsService = {' + methods);

fs.writeFileSync('src/services/metrics.service.ts', text);
console.log('Added metrics');
