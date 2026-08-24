import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Retrieve and log session data from sessionStorage
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (userData) {
      console.log('Session Data:', userData);
    } else {
      console.log('No session data found');
    }
  }, []);

  const getCsrfToken = () => {
    let csrfToken = null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      if (cookie.trim().startsWith('csrftoken=')) {
        csrfToken = cookie.trim().split('=')[1];
        break;
      }
    }
    return csrfToken;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const csrfToken = getCsrfToken();
    try {
      const response = await axios.post('http://127.0.0.1:8000/account/password_validation/', { password }, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });
      if (response.data.message === 'Account created successfully. You can now login.') {
        navigate('/');
      } else {
        setError(response.data.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Verify Your Password
        </h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Verify Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyPassword;

