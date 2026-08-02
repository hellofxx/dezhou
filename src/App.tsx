import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/routes';
import { Providers } from '@/app/providers';
import { Toaster } from '@/shared/components/ui/toast';
import { ErrorBoundary } from '@/shared/components/business/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
        <Toaster />
      </Providers>
    </ErrorBoundary>
  );
}
