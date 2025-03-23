/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/20/solid';
import axios from 'axios';
import loginImage from '../../assets/pictures/abanyabuzima.jpg';

const Login = () => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phone) => {
    const phoneRegex = /^(078|072|079|073)\d{7}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isValidLength = password.length >= 8;

    return hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar && isValidLength;
  };

  const handlePhoneChange = (e) => {
    const newPhone = e.target.value;
    setPhone(newPhone);

    if (newPhone && !validatePhone(newPhone)) {
      setError('Phone number must be 10 digits and start with 078, 072, 079, or 073.');
    } else {
      setError('');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(phone)) {
      setError('Phone number must be 10 digits and start with 078, 072, 079, or 073.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one digit, and one special character.');
      return;
    }

    setIsLoading(true);

    axios.post(
      'http://127.0.0.1:8000/login/',
      {
        phone: phone,
        password: password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
      .then((res) => {
        setIsLoading(false);

        if (res.data) {
          console.log('User data returned from API:', res.data);

          const user = {
            id: res.data.id,
            role: res.data.role,
            created_at: res.data.created_at,
            phone: res.data.phone,
            refresh_token: res.data.refresh_token,
            access_token: res.data.access_token,
          };

          localStorage.setItem('userData', JSON.stringify(user));
          localStorage.setItem('token', res.data.access_token);

          console.log('User role:', user.role);
          console.log('Trimmed and lowercased role:', user.role.trim().toLowerCase());

          if (user.role.trim().toLowerCase() === 'ceho') {
            navigate('/admin');
          } else if (user.role.trim().toLowerCase() === 'chw') {
            axios.get('http://127.0.0.1:8000/worker/me/', {
              headers: {
                'Authorization': `Bearer ${res.data.access_token}`,
              },
            })
              .then((workerRes) => {
                if (workerRes.data) {
                  navigate('/chw');
                } else {
                  navigate('/chw/register');
                }
              })
              .catch((workerError) => {
                console.error('Error fetching worker information:', workerError);
                navigate('/register');
              });
          } else if (user.role.trim().toLowerCase() === 'citizen') {
            navigate('/citizen');
          } else {
            console.log('Unknown user role. Please contact support.');
          }
        } else {
          console.log("No data");
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error('Error during login:', error.response || error.message || error);
        setError('Invalid phone or password.');
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Glass-morphism card */}
      <div className="grid lg:grid-cols-2 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden bg-white/80 backdrop-blur-sm border border-white/20">
        {/* Left side - Image with overlay */}
        <div className="hidden lg:block relative">
          <div className="absolute inset-0 bg-purple-900/30 z-10"></div>
          <img 
            src={loginImage} 
            alt="Login" 
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center z-20 text-white p-10">
            <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
            <p className="text-lg text-center max-w-md">Access your account to manage your health services and community information.</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex items-center justify-center py-8 px-8 lg:px-12 w-full">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">Access your health services dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Phone Input with floating label */}
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="peer h-14 w-full rounded-lg border border-gray-300 px-3 pt-5 pb-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  placeholder=" "
                  required
                />
                <label 
                  htmlFor="phone" 
                  className="absolute top-2 left-3 text-xs text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs"
                >
                  Phone Number
                </label>
              </div>

              {/* Password Input with floating label */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="peer h-14 w-full rounded-lg border border-gray-300 px-3 pt-5 pb-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  placeholder=" "
                  required
                />
                <label 
                  htmlFor="password" 
                  className="absolute top-2 left-3 text-xs text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs"
                >
                  Password
                </label>
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-2 hover:bg-gray-100 rounded-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  )}
                </span>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link to="/passwordreset" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="group relative flex w-full justify-center items-center h-14 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 overflow-hidden"
                disabled={isLoading}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <LockClosedIcon className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" aria-hidden="true" />
                  )}
                </span>
                <span className="ml-2">{isLoading ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </form>

            <div className="mt-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <p className="mt-6 text-center text-base text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                  Create an account
                </Link>
              </p>


              <p className="mt-6 text-center text-base text-gray-600">
              
                <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                  Back to Home
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;