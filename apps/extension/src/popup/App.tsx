import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './routes.js';
import { Toaster } from './components/Toaster.js';

export default function App() {
  return (
    <HashRouter>
      <div className="screen bg-[#0f0f23]">
        <AppRoutes />
        <Toaster />
      </div>
    </HashRouter>
  );
}
