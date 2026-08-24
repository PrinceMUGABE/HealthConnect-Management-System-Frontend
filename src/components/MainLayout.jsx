/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  FaFacebook, FaInstagram, FaLinkedin, FaUserCircle,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowRight,
  FaCheckCircle, FaHeartbeat, FaUsers, FaHospital, 
  FaAmbulance, FaStethoscope, FaPills, FaShieldAlt,
  FaTimes, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { HiMenuAlt3, HiMenuAlt1 } from 'react-icons/hi';
import { BiSolidSun, BiSolidMoon } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Logo from '../assets/pictures/logo_lil.jpeg';
import hero from '../assets/pictures/ministry_of_healthy_image.jpg';
import AboutImg from '../assets/pictures/abanyabuzuma2.jpg';

// ============================================
// AUTH MODALS
// ============================================

// Login Modal
const LoginModal = ({ isOpen, onClose, onSwitchToRegister, onSwitchToReset }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phone) => /^(078|072|079|073)\d{7}$/.test(phone);
  const validatePassword = (password) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password) && 
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(phone)) {
      setError('Phone number must be 10 digits starting with 078, 072, 079, or 073.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/login/', {
        phone: phone,
        password: password,
      });

      if (response.data) {
        const user = {
          id: response.data.id,
          role: response.data.role,
          phone: response.data.phone,
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
        };

        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('token', response.data.access_token);
        
        // Redirect based on role
        const role = user.role.trim().toLowerCase();
        if (role === 'ceho') window.location.href = '/admin';
        else if (role === 'chw') window.location.href = '/chw';
        else if (role === 'citizen') window.location.href = '/citizen';
        
        onClose();
      }
    } catch (error) {
      setError('Invalid phone or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FaTimes className="text-gray-500" />
        </button>

        {/* Header */}
        <div className="p-8 pb-0">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to access your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              placeholder="0781234567"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSwitchToReset}
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-green-600 dark:text-green-400 font-medium hover:underline"
            >
              Create one now
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

// Register Modal (Step-based)
const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validatePhone = (phone) => /^(078|079|072|073)\d{7}$/.test(phone);
  const validatePassword = (password) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password) && 
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, text: '', color: 'bg-gray-200' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const strengthMap = {
      1: { text: 'Very Weak', color: 'bg-red-500' },
      2: { text: 'Weak', color: 'bg-orange-500' },
      3: { text: 'Medium', color: 'bg-yellow-500' },
      4: { text: 'Strong', color: 'bg-blue-500' },
      5: { text: 'Very Strong', color: 'bg-green-500' }
    };
    
    return { 
      strength: (strength / 5) * 100, 
      text: strengthMap[strength]?.text || '',
      color: strengthMap[strength]?.color || 'bg-gray-200'
    };
  };

  const passwordStrength = getPasswordStrength();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const nextStep = () => {
    const stepErrors = {};
    if (step === 1) {
      if (!validatePhone(formData.phone)) {
        stepErrors.phone = 'Phone must be 10 digits starting with 078, 079, 072, or 073.';
      }
      if (!formData.role) {
        stepErrors.role = 'Please select a role.';
      }
    } else if (step === 2) {
      if (!validatePassword(formData.password)) {
        stepErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.';
      }
      if (formData.password !== formData.confirmPassword) {
        stepErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (Object.keys(stepErrors).length === 0) {
      setStep(step + 1);
    } else {
      setErrors(stepErrors);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/signup/', {
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      if (response.status === 201) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          onSwitchToLogin();
          setStep(1);
          setFormData({ phone: '', role: '', password: '', confirmPassword: '' });
        }, 2000);
      }
    } catch (error) {
      setErrors({
        form: error.response?.data?.error || 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FaTimes className="text-gray-500" />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Join our healthcare community</p>

          {/* Step Indicators */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>1</div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>2</div>
            </div>
          </div>

          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {errors.form}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0781234567"
                    required
                  />
                  {errors.phone && <p className="mt-1 text-red-500 text-sm">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Your Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="citizen">Citizen</option>
                    <option value="chw">Health Worker</option>
                  </select>
                  {errors.role && <p className="mt-1 text-red-500 text-sm">{errors.role}</p>}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${passwordStrength.color}`} style={{ width: `${passwordStrength.strength}%` }} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Strength: {passwordStrength.text}
                      </p>
                    </div>
                  )}
                  
                  {errors.password && <p className="mt-1 text-red-500 text-sm">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-red-500 text-sm">{errors.confirmPassword}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-green-600 dark:text-green-400 font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Reset Password Modal
const ResetPasswordModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phone) => /^(078|079|072|073)\d{7}$/.test(phone);
  const validatePassword = (password) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password) && 
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validatePhone(phone)) {
      setError('Phone must be 10 digits starting with 078, 079, 072, or 073.');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/forget_password/', {
        phone: phone,
        new_password: newPassword,
      });

      if (response.data.message === "Password reset successfully.") {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          onSwitchToLogin();
          setPhone('');
          setNewPassword('');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FaTimes className="text-gray-500" />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Enter your phone number and create a new password</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0781234567"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-green-600 dark:text-green-400 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// MAIN COMPONENTS (Navbar, Hero, About, Services, Contact, Footer)
// ============================================

// Menu Links Data
const MenuLinks = [
  { id: 1, name: "Home", link: "#home" },
  { id: 2, name: "About", link: "#about" },
  { id: 3, name: "Services", link: "#services" },
  { id: 4, name: "Contact", link: "#contact" },
];

// Services Data
const services = [
  { 
    icon: <FaHeartbeat className="text-4xl" />, 
    title: "Community Health", 
    desc: "Comprehensive community health services for all Rwandans",
    color: "from-green-500 to-emerald-600"
  },
  { 
    icon: <FaUsers className="text-4xl" />, 
    title: "Patient Management", 
    desc: "Efficient patient records and tracking system",
    color: "from-blue-500 to-indigo-600"
  },
  { 
    icon: <FaAmbulance className="text-4xl" />, 
    title: "Emergency Response", 
    desc: "Rapid emergency response coordination",
    color: "from-red-500 to-rose-600"
  },
  { 
    icon: <FaStethoscope className="text-4xl" />, 
    title: "Medical Consultation", 
    desc: "Professional medical consultation services",
    color: "from-purple-500 to-violet-600"
  },
  { 
    icon: <FaPills className="text-4xl" />, 
    title: "Pharmacy Services", 
    desc: "Integrated pharmacy and medication management",
    color: "from-yellow-500 to-amber-600"
  },
  { 
    icon: <FaShieldAlt className="text-4xl" />, 
    title: "Health Insurance", 
    desc: "Comprehensive health insurance management",
    color: "from-teal-500 to-cyan-600"
  },
];

// Stats Data
const stats = [
  { value: "100+", label: "Health Centers", icon: <FaHospital className="text-3xl text-green-400" /> },
  { value: "50K+", label: "Patients Served", icon: <FaUsers className="text-3xl text-blue-400" /> },
  { value: "200+", label: "Health Workers", icon: <FaUserCircle className="text-3xl text-purple-400" /> },
  { value: "98%", label: "Satisfaction Rate", icon: <FaCheckCircle className="text-3xl text-amber-400" /> },
];

// Dark Mode Component
const DarkMode = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const element = document.documentElement;
    if (theme === "dark") {
      element.classList.add("dark");
    } else {
      element.classList.remove("dark");
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <BiSolidSun className="text-2xl text-yellow-400 hover:rotate-90 transition-transform duration-300" />
      ) : (
        <BiSolidMoon className="text-2xl text-gray-700 hover:rotate-90 transition-transform duration-300" />
      )}
    </button>
  );
};

// Responsive Menu Component
const ResponsiveMenu = ({ showMenu, setShowMenu, onOpenLogin }) => {
  return (
    <AnimatePresence>
      {showMenu && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed inset-y-0 left-0 z-50 w-[80%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl rounded-r-2xl overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
              <img src={Logo} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">CHW</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">HealthConnect</p>
              </div>
            </div>

            <nav className="space-y-2">
              {MenuLinks.map(({ id, name, link }) => (
                <motion.a
                  key={id}
                  href={link}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 font-medium"
                  whileHover={{ x: 10 }}
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {name}
                </motion.a>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenLogin();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-[1.02]"
              >
                Login
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Made with ❤ by <a href="www.linkedin.com/in/mugabe-prince-2b377621b" className="text-green-600 dark:text-green-400 hover:underline">Prince</a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Navbar Component
const Navbar = ({ onOpenLogin }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <a href="#home" className="flex items-center gap-3 group">
              <div className="relative">
                <img src={Logo} alt="Logo" className="w-12 h-12 rounded-full object-cover ring-2 ring-green-500/30 shadow-lg shadow-green-500/20" />
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-xl group-hover:animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">CHW</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">HealthConnect</p>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {MenuLinks.map(({ id, name, link }) => (
                <a
                  key={id}
                  href={link}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300"
                >
                  {name}
                </a>
              ))}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                <DarkMode />
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-105"
                >
                  Login
                </button>
              </div>
            </nav>

            {/* Mobile Controls */}
            <div className="flex items-center gap-3 md:hidden">
              <DarkMode />
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
              >
                {showMenu ? (
                  <HiMenuAlt1 className="text-2xl" />
                ) : (
                  <HiMenuAlt3 className="text-2xl" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <ResponsiveMenu showMenu={showMenu} setShowMenu={setShowMenu} onOpenLogin={onOpenLogin} />
    </>
  );
};

// Hero Section
const Hero = () => {
  return (
    <section id="home" className="min-h-screen flex items-center pt-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-green-900/20" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-green-300/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 order-2 md:order-1"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Community Health System</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Empowering{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Community Health
              </span>
              <br />
              Workers Across Rwanda
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              Created in January 2011, CHW is a private company providing comprehensive services in community health management and healthcare solutions.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.a
                href="#about"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 flex items-center gap-2"
              >
                Learn More <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:border-green-600 dark:hover:border-green-400 transition-all duration-300"
              >
                Get in Touch
              </motion.a>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {stats.slice(0, 2).map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/30"
                >
                  {stat.icon}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 md:order-2 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={hero}
                alt="Community Health"
                className="w-full h-[400px] sm:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl px-6 py-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">98% Satisfaction</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">From our community</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// About Section
const About = () => {
  return (
    <section id="about" className="py-20 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            About <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Us</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Committed to providing quality healthcare services for all Rwandans
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={AboutImg} alt="About CHW" className="w-full h-[400px] object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl px-6 py-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <FaHeartbeat className="text-2xl text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">10+ Years</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Of Service Excellence</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Our Mission</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                The overall objective of the health sector is to ensure universal accessibility of equitable and affordable quality health services for all Rwandans.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Our Vision</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                To pursue an integrated and community-driven development process through the provision of equitable, accessible and quality health care services.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Our Values</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Integrity, Compassion, Excellence, and Innovation in healthcare delivery for the well-being of all Rwandans.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex justify-center mb-3">{stat.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Services Section
const Services = () => {
  return (
    <section id="services" className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/30 dark:to-gray-900/30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Services</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive healthcare solutions designed for community well-being
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{service.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{service.desc}</p>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-medium group-hover:gap-3 transition-all duration-300">
                    Learn more <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Contact Section
const Contact = () => {
  const [formData, setFormData] = useState({
    names: '',
    email: '',
    subject: '',
    description: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = '';
    if (name === 'names' || name === 'subject') {
      if (!value.trim()) error = 'This field is required';
      else if (/[^a-zA-Z\s]/.test(value)) error = 'No numbers or special characters allowed';
    } else if (name === 'email') {
      if (!value.trim()) error = 'Email is required';
      else if (!value.endsWith('@gmail.com')) error = 'Email must end with @gmail.com';
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage('Please fix all errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/contact/', formData);
      if (response.status === 200) {
        setMessage('Message sent successfully! 🎉');
        setFormData({ names: '', email: '', subject: '', description: '' });
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get in <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Touch</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Reach out to us anytime.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <FaPhone className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">+250 783 201 428</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <FaEnvelope className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">info@chw.rw</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <FaMapMarkerAlt className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-semibold text-gray-900 dark:text-white">Kigali, Rwanda</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Follow Us</h4>
              <div className="flex gap-4">
                {[FaFacebook, FaInstagram, FaLinkedin].map((Icon, idx) => (
                  <a key={idx} href="#" className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white dark:hover:bg-green-600 transition-all duration-300 hover:scale-110">
                    <Icon className="text-xl" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${
                    message.includes('success') 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="names"
                      value={formData.names}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                    />
                    {errors.names && <p className="text-red-500 text-xs mt-1">{errors.names}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter subject"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                  />
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Write your message..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Footer Section
const Footer = () => {
  const FooterLinks = [
    { title: "Home", link: "#home" },
    { title: "About", link: "#about" },
    { title: "Services", link: "#services" },
    { title: "Contact", link: "#contact" },
  ];

  const HelpLinks = [
    { title: "FAQ", link: "#" },
    { title: "Support", link: "#" },
    { title: "Privacy Policy", link: "#" },
    { title: "Terms of Service", link: "#" },
  ];

  const ResourcesLinks = [
    { title: "Health Tips", link: "#" },
    { title: "Community Programs", link: "#" },
    { title: "Reports", link: "#" },
    { title: "News", link: "#" },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="CHW" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h2 className="text-2xl font-bold text-white">CHW</h2>
                <p className="text-sm text-gray-400">HealthConnect</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering community health workers with innovative management solutions for better healthcare delivery across Rwanda.
            </p>
            <div className="flex gap-4">
              {[FaFacebook, FaInstagram, FaLinkedin].map((Icon, idx) => (
                <a key={idx} href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-green-600 transition-all duration-300 hover:scale-110">
                  <Icon className="text-lg" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3">
              {FooterLinks.map((link) => (
                <li key={link.title}>
                  <a href={link.link} className="text-gray-400 hover:text-green-400 transition-colors duration-300 hover:translate-x-1 inline-block">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Help</h3>
            <ul className="space-y-3">
              {HelpLinks.map((link) => (
                <li key={link.title}>
                  <a href={link.link} className="text-gray-400 hover:text-green-400 transition-colors duration-300 hover:translate-x-1 inline-block">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Resources</h3>
            <ul className="space-y-3">
              {ResourcesLinks.map((link) => (
                <li key={link.title}>
                  <a href={link.link} className="text-gray-400 hover:text-green-400 transition-colors duration-300 hover:translate-x-1 inline-block">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CHW HealthConnect. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Made with ❤ by <a href="www.linkedin.com/in/mugabe-prince-2b377621b" className="text-green-400 hover:text-green-300 transition-colors">Prince</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

const MainLayout = () => {
  const [activeModal, setActiveModal] = useState(null);

  const openLogin = () => setActiveModal('login');
  const openRegister = () => setActiveModal('register');
  const openReset = () => setActiveModal('reset');
  const closeModal = () => setActiveModal(null);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      <Navbar onOpenLogin={openLogin} />
      <Hero />
      <About />
      <Services />
      <Contact />
      <Footer />

      {/* Auth Modals */}
      <AnimatePresence>
        {activeModal === 'login' && (
          <LoginModal
            isOpen={true}
            onClose={closeModal}
            onSwitchToRegister={openRegister}
            onSwitchToReset={openReset}
          />
        )}

        {activeModal === 'register' && (
          <RegisterModal
            isOpen={true}
            onClose={closeModal}
            onSwitchToLogin={openLogin}
          />
        )}

        {activeModal === 'reset' && (
          <ResetPasswordModal
            isOpen={true}
            onClose={closeModal}
            onSwitchToLogin={openLogin}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;