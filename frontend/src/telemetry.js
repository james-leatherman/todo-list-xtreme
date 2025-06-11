// OpenTelemetry Web SDK setup
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { trace } from '@opentelemetry/api';

// Create a resource with service information
const resource = resourceFromAttributes({
  'service.name': 'todo-list-xtreme-frontend',
  'service.version': '1.4.0',
  'service.instance.id': `frontend-${Date.now()}`,
});

// Create OTLP trace exporter
const otlpExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // OTLP HTTP endpoint
  headers: {},
});

// Create tracer provider with span processor
const provider = new WebTracerProvider({
  resource,
  spanProcessors: [new BatchSpanProcessor(otlpExporter)],
});

// Register the provider
provider.register();

// Register instrumentations
registerInstrumentations({
  instrumentations: [
    new XMLHttpRequestInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /localhost:8000/, // Backend URL
        /127\.0\.0\.1:8000/,
      ],
      requestHook: (span, request) => {
        // Add custom attributes to spans
        span.setAttributes({
          'http.user_agent': navigator.userAgent,
          'frontend.component': 'api-call',
        });
      },
    }),
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /localhost:8000/, // Backend URL
        /127\.0\.0\.1:8000/,
      ],
      requestHook: (span, request) => {
        // Add custom attributes to spans
        span.setAttributes({
          'http.user_agent': navigator.userAgent,
          'frontend.component': 'api-call',
        });
      },
    }),
  ],
});

// Get tracer for custom spans
export const tracer = trace.getTracer('todo-list-xtreme-frontend', '1.4.0');

console.log('OpenTelemetry Web SDK initialized');
