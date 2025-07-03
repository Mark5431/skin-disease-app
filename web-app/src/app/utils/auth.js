const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export const auth = {
  // Check if user is authenticated
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) return false;
    
    // Check if token is expired
    return new Date() < new Date(expiry);
  },

  // Get current user data
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    return {
      userId: localStorage.getItem('user_id'),
      username: localStorage.getItem('username'),
      email: localStorage.getItem('userEmail'),
      firstName: localStorage.getItem('firstName'),
      lastName: localStorage.getItem('lastName'),
      token: localStorage.getItem('authToken'),
    };
  },

  // Verify token with server
  verifyToken: async () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const response = await fetch(`${apiBase}/check-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update localStorage with latest user data
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('firstName', data.firstName || '');
        localStorage.setItem('lastName', data.lastName || '');
        return data.message === 'Session valid';
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  },

  // Logout user
  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user_id');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/login';
  },

  // Redirect to login if not authenticated
  requireAuth: () => {
    if (typeof window === 'undefined') return;
    if (!auth.isAuthenticated()) {
      window.location.href = '/login';
      return false;
    }
    return true;
  },

  // Get user profile from server
  getUserProfile: async () => {
    if (typeof window === 'undefined') return null;
    const currentUser = auth.getCurrentUser();
    if (!currentUser?.userId) return null;

    try {
      const response = await fetch(`${apiBase}/get-user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: currentUser.userId }),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  },

  // Get user's prediction history
  getUserPredictions: async () => {
    if (typeof window === 'undefined') return [];
    const currentUser = auth.getCurrentUser();
    if (!currentUser?.userId) return [];

    try {
      const response = await fetch(`${apiBase}/get-user-predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: currentUser.userId }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.predictions || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get user predictions:', error);
      return [];
    }
  }
};
