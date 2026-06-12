import { type ReactNode } from 'react';
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react';
import { initializePostHog } from '../../analytics/posthogAnalytics';

const postHogClient = initializePostHog();

function RootErrorFallback() {
  return (
    <div className="min-h-screen bg-blink-bg flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-xl font-bold text-blink-ink">Algo salió mal</h1>
        <p className="mt-2 text-sm text-blink-muted">Recargá la página para volver a intentarlo.</p>
      </div>
    </div>
  );
}

function PostHogShell({ children }: { children: ReactNode }) {
  if (!postHogClient) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider client={postHogClient}>
      <PostHogErrorBoundary
        fallback={<RootErrorFallback />}
        additionalProperties={{ source: 'react_error_boundary' }}
      >
        {children}
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}

export default PostHogShell;
