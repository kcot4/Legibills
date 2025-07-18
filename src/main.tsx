import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate
} from 'react-router-dom';
import App from './App';
import './index.css';
import { useBillContext } from './context/BillContext'; // Import useBillContext

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BillDetails = lazy(() => import('./pages/BillDetails'));
const Search = lazy(() => import('./pages/Search'));
const Alerts = lazy(() => import('./pages/Alerts'));
const SavedBills = lazy(() => import('./pages/SavedBills'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const Topic = lazy(() => import('./pages/Topic'));
const Topics = lazy(() => import('./pages/Topics'));
const Committee = lazy(() => import('./pages/Committee'));
const Committees = lazy(() => import('./pages/Committees'));
const Settings = lazy(() => import('./pages/Settings'));
const CategoryView = lazy(() => import('./pages/CategoryView'));
const Admin = lazy(() => import('./pages/Admin'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const TrackLegislators = lazy(() => import('./pages/TrackLegislators')); // New lazy-loaded component

// Admin Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userRole } = useBillContext();
  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error boundary component
const ErrorBoundary = () => (
  <div className="flex items-center justify-center min-h-screen">
    <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
    <p className="text-gray-600 mb-4">Please try refreshing the page</p>
    <button 
      onClick={() => window.location.reload()}
      className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
    >
      Refresh
    </button>
  </div>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route 
      path="/" 
      element={<App />}
      errorElement={<ErrorBoundary />}
    >
      <Route index element={<Dashboard />} />
      <Route path="bill/:id" element={<BillDetails />} />
      <Route path="search" element={<Search />} />
      <Route path="alerts" element={<Alerts />} />
      <Route path="saved" element={<SavedBills />} />
      <Route path="analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
      <Route path="profile" element={<Profile />} />
      {/* Protected Topic Routes */}
      <Route path="topic/:topicId" element={<AdminRoute><Topic /></AdminRoute>} />
      <Route path="topics" element={<AdminRoute><Topics /></AdminRoute>} />
      <Route path="committee/:committeeId" element={<Committee />} />
      <Route path="committees" element={<Committees />} />
      <Route path="settings" element={<Settings />} />
      <Route path="category/:category" element={<CategoryView />} />
      <Route path="admin" element={<Admin />} />
      <Route path="update-password" element={<UpdatePasswordPage />} />
      <Route path="track-legislators" element={<AdminRoute><TrackLegislators /></AdminRoute>} /> {/* New route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Suspense>
  </StrictMode>
);