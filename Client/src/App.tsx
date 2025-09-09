import { Outlet } from 'react-router-dom';
import { AuthProvider } from 'contexts/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

export default App;
