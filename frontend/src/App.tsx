import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import { PlatformManagement } from './components';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const isManagementPage = location.pathname === '/management';

  return (
    <>
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl sm:text-3xl font-bold text-gray-900 hover:text-gray-700">
              热点新闻聚合
            </Link>
            <nav className="flex items-center space-x-4">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !isManagementPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                新闻
              </Link>
              <Link
                to="/management"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isManagementPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                平台管理
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 路由内容 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/management"
          element={
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <PlatformManagement />
            </main>
          }
        />
      </Routes>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            热点新闻聚合系统 © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;
