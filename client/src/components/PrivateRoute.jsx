// src/components/PrivateRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation(); // current URL

  if (!isAuthenticated) {
    // state={{ from: location }} passes where the user was trying to go
    // After login, we can redirect them back there
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children; // user is authenticated — render the protected page
};

export default PrivateRoute;