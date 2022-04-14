import { AzureMonitorQuery, AzureQueryType } from '../types';
import migrateQuery from './migrateQuery';

const azureMonitorQueryV7 = {
  appInsights: { dimension: [], metricName: 'select', timeGrain: 'auto' },
  azureLogAnalytics: {
    query:
      '//change this example to create your own time series query\n<table name>                                                              //the table to query (e.g. Usage, Heartbeat, Perf)\n| where $__timeFilter(TimeGenerated)                                      //this is a macro used to show the full chart’s time range, choose the datetime column here\n| summarize count() by <group by column>, bin(TimeGenerated, $__interval) //change “group by column” to a column in your table, such as “Computer”. The $__interval macro is used to auto-select the time grain. Can also use 1h, 5m etc.\n| order by TimeGenerated asc',
    resultFormat: 'time_series',
    workspace: 'e3fe4fde-ad5e-4d60-9974-e2f3562ffdf2',
  },
  azureMonitor: {
    aggregation: 'Average',
    allowedTimeGrainsMs: [60000, 300000, 900000, 1800000, 3600000, 21600000, 43200000, 86400000],
    dimensionFilters: [{ dimension: 'dependency/success', filter: '', operator: 'eq' }],
    metricDefinition: 'microsoft.insights/components',
    metricName: 'dependencies/duration',
    metricNamespace: 'microsoft.insights/components',
    resourceGroup: 'cloud-datasources',
    resourceName: 'AppInsightsTestData',
    timeGrain: 'auto',
    top: '10',
  },
  insightsAnalytics: {
    query: '',
    resultFormat: 'time_series',
  },
  queryType: AzureQueryType.AzureMonitor,
  refId: 'A',
  subscription: '44693801-6ee6-49de-9b2d-9106972f9572',
};

const azureMonitorQueryV8 = {
  azureMonitor: {
    aggregation: 'Average',
    dimensionFilters: [],
    metricDefinition: 'microsoft.insights/components',
    metricName: 'dependencies/duration',
    metricNamespace: 'microsoft.insights/components',
    resourceGroup: 'cloud-datasources',
    resourceName: 'AppInsightsTestData',
    timeGrain: 'auto',
  },
  datasource: {
    type: 'grafana-azure-monitor-datasource',
    uid: 'sD-ZuB87k',
  },
  queryType: AzureQueryType.AzureMonitor,
  refId: 'A',
  subscription: '44693801-6ee6-49de-9b2d-9106972f9572',
};

const modernMetricsQuery: AzureMonitorQuery = {
  appInsights: { dimension: [], metricName: 'select', timeGrain: 'auto' },
  azureLogAnalytics: {
    query:
      '//change this example to create your own time series query\n<table name>                                                              //the table to query (e.g. Usage, Heartbeat, Perf)\n| where $__timeFilter(TimeGenerated)                                      //this is a macro used to show the full chart’s time range, choose the datetime column here\n| summarize count() by <group by column>, bin(TimeGenerated, $__interval) //change “group by column” to a column in your table, such as “Computer”. The $__interval macro is used to auto-select the time grain. Can also use 1h, 5m etc.\n| order by TimeGenerated asc',
    resultFormat: 'time_series',
    workspace: 'e3fe4fde-ad5e-4d60-9974-e2f3562ffdf2',
  },
  azureMonitor: {
    aggregation: 'Average',
    alias: '{{ dimensionvalue }}',
    allowedTimeGrainsMs: [60000, 300000, 900000, 1800000, 3600000, 21600000, 43200000, 86400000],
    dimensionFilters: [{ dimension: 'dependency/success', filter: '', operator: 'eq' }],
    metricDefinition: 'microsoft.insights/components',
    metricName: 'dependencies/duration',
    metricNamespace: 'microsoft.insights/components',
    resourceGroup: 'cloud-datasources',
    resourceName: 'AppInsightsTestData',
    resourceUri:
      '/subscriptions/44693801-6ee6-49de-9b2d-9106972f9572/resourceGroups/cloud-datasources/providers/microsoft.insights/components/AppInsightsTestData',
    timeGrain: 'PT5M',
    top: '10',
  },
  azureResourceGraph: { resultFormat: 'table' },
  insightsAnalytics: { query: '', resultFormat: 'time_series' },
  queryType: AzureQueryType.AzureMonitor,
  refId: 'A',
  subscription: '44693801-6ee6-49de-9b2d-9106972f9572',
  subscriptions: ['44693801-6ee6-49de-9b2d-9106972f9572'],
};

describe('AzureMonitor: migrateQuery', () => {
  it('modern queries should not change', () => {
    const result = migrateQuery(modernMetricsQuery);

    // MUST use .toBe because we want to assert that the identity of unmigrated queries remains the same
    expect(modernMetricsQuery).toBe(result);
  });

  describe('migrating from a v7 query to the latest query version', () => {
    it('should build a resource uri', () => {
      const result = migrateQuery(azureMonitorQueryV7);
      expect(result).toMatchObject(
        expect.objectContaining({
          azureMonitor: expect.objectContaining({
            resourceUri:
              '/subscriptions/44693801-6ee6-49de-9b2d-9106972f9572/resourceGroups/cloud-datasources/providers/microsoft.insights/components/AppInsightsTestData',
          }),
        })
      );
    });
  });

  describe('migrating from a v8 query to the latest query version', () => {
    it('should build a resource uri', () => {
      const result = migrateQuery(azureMonitorQueryV8);
      expect(result).toMatchObject(
        expect.objectContaining({
          azureMonitor: expect.objectContaining({
            resourceUri:
              '/subscriptions/44693801-6ee6-49de-9b2d-9106972f9572/resourceGroups/cloud-datasources/providers/microsoft.insights/components/AppInsightsTestData',
          }),
        })
      );
    });
  });
});
