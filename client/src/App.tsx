import './App.css';

import {
  BrowserRouter,
} from 'react-router-dom';

import AuthInitializer from './modules/auth/AuthInitializer';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <AppRouter />
      </AuthInitializer>
    </BrowserRouter>
  );
}

export default App;