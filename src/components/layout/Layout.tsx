import React, { ReactNode, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  setShowAuthModal: (show: boolean) => void; // New prop
}

const Layout: React.FC<LayoutProps> = ({ children, setShowAuthModal }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-gray-900 dark:text-gray-100">
      <Navbar setShowAuthModal={setShowAuthModal} /> {/* Pass prop to Navbar */}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={toggleSidebar}
            className="bg-primary-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Sidebar - hidden on mobile unless toggled */}
        <div 
          className={`
            lg:relative fixed inset-y-0 left-0 
            transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            lg:translate-x-0 transition-transform duration-300 ease-in-out
            bg-white w-64 lg:w-72 z-40 shadow-md dark:bg-gray-800
          `}
        >
          <Sidebar toggleSidebar={toggleSidebar} />
        </div>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
