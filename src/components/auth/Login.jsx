// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/20/solid';
import axios from 'axios';
import loginImage from '../../assets/pictures/login.jpeg'; // Assuming the path to the image

const Login = () => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility toggle
  const [isLoading, setIsLoading] = useState(false); // State for loading

  const validatePhone = (phone) => {
    const phoneRegex = /^(078|072|079|073)\d{7}$/; // Validate phone number against the specified criteria
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
      setError(''); // Clear error if valid
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

    setIsLoading(true); // Set loading state

    axios.post(
      'http://127.0.0.1:8000/login/',
      {
        phone: phone,
        password: password,
      },
      {
        headers: {
          'Content-Type': 'application/json',  // Ensure the content type is set
        },
      }
    )
    .then((res) => {
      setIsLoading(false); // Stop loading
    
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
    
        // Role-based redirection logic
        if (user.role.trim().toLowerCase() === 'ceho') {
          navigate('/admin');
        } else if (user.role.trim().toLowerCase() === 'chw') {
          navigate('/chw');
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
      setIsLoading(false);  // Stop loading
      console.error('Error during login:', error.response || error.message || error);
      setError('Invalid phone or password.');
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen h-full bg-gray-50">
      {/* Main content container */}
      <div className="grid lg:grid-cols-2 rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
        {/* Left side - Image */}
        <div className="hidden lg:block">
          <img src={loginImage} alt="Login" className="object-cover w-full h-full" />
        </div>

        {/* Right side - Form */}
        <div className="flex items-center justify-center bg-white py-6 px-6 lg:px-8 w-full">
          <div className="sm:max-w-md w-full">
            <h2 className="mt-3 text-center text-2xl font-bold text-gray-900">Login here</h2>
            <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <form className="mt-8 space-y-2" onSubmit={handleLogin}>
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={phone}
                  onChange={handlePhoneChange} // Use new handlePhoneChange function
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <Link to="/passwordreset" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                    required
                  />
                  <span
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                    )}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="group relative flex w-full justify-center rounded-md bg-purple-500 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading} // Disable button while loading
                >
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    ) : (
                      <LockClosedIcon className="h-5 w-5 text-purple-400 group-hover:text-indigo-400" aria-hidden="true" />
                    )}
                  </span>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm text-gray-500">
              Not a member?{' '}
              <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;