/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyIcon, ArrowLeftIcon } from '@heroicons/react/20/solid';
import axios from 'axios';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    new_password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const validatePhone = (phone) => {
    const phoneRegex = /^(078|079|072|073)\d{7}$/;
    return phoneRegex.test(phone) && phone.length === 10;
  };

  const validatePassword = (password) => {
    const minLength = 5;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return password.length >= minLength && hasSpecialChar && hasUppercase && hasLowercase && hasNumber;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate phone number before proceeding
    if (!validatePhone(formData.phone)) {
      setError('Phone number must be exactly 10 digits and start with 078, 079, 072, or 073.');
      setMessage('');
      setIsLoading(false);
      return;
    }

    // Validate password
    if (!validatePassword(formData.new_password)) {
      setError('Password must be at least 5 characters long, contain a special character, an uppercase letter, a lowercase letter, and a number.');
      setMessage('');
      setIsLoading(false);
      return;
    }

    const csrfToken = getCsrfToken();
    try {
      const response = await axios.post('http://127.0.0.1:8000/forget_password/', formData, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });

      if (response.data.message === "Password reset successfully.") {
        setFormData({ phone: '', new_password: '' });
        setMessage('Password reset successfully. Please check your phone for confirmation.');
        setError('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.error || 'Password reset failed. Please try again.');
        setMessage('');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Phone number not found.');
      } else {
        setError(error.response?.data?.error || 'An error occurred. Please try again.');
      }
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-purple-100 mb-4">
            <KeyIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600">Enter your phone number and create a new password</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Phone Input with floating label */}
          <div className="relative">
            <input
              id="phone"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
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
              name="new_password"
              type="password"
              value={formData.new_password}
              onChange={handleChange}
              className="peer h-14 w-full rounded-lg border border-gray-300 px-3 pt-5 pb-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
              placeholder=" "
              required
            />
            <label 
              htmlFor="password" 
              className="absolute top-2 left-3 text-xs text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs"
            >
              New Password
            </label>
          </div>

          {/* Password requirements helper text */}
          <div className="text-xs text-gray-500 px-1">
            <p>Password must contain:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>At least 5 characters</li>
              <li>At least one uppercase letter (A-Z)</li>
              <li>At least one lowercase letter (a-z)</li>
              <li>At least one number (0-9)</li>
              <li>At least one special character (!@#$%^&*)</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="group relative flex w-full justify-center items-center h-14 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;