import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useCourseStore } from '../../stores/courseStore'

export function AppLayout() {
  const { sidebarOpen, openSidebar, closeSidebar } = useCourseStore()

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-deep-900/50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 right-0 z-40 h-screen w-72
          transform transition-transform duration-300 ease-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar onClose={closeSidebar} />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-20 bg-cream-50/90 backdrop-blur-sm border-b border-cream-300 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-navy-800">מורה חכם</h1>
          <button
            onClick={openSidebar}
            className="p-2 rounded-lg text-navy-600 hover:bg-cream-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="p-6 lg:p-10 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
