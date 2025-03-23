/* eslint-disable no-unused-vars */
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import loginImage from '../../assets/pictures/abanyabuzuma2.jpg';

const Register = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [formData, setFormData] = useState({
    phone: '',
    role: 'Choose Role',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Track the current step of the registration process

  const validateFields = () => {
    const newErrors = {};

    if (!/^(078|079|072|073)\d{7}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits starting with 078, 079, 072, or 073.';
    }

    if (formData.role === 'Choose Role') {
      newErrors.role = 'You must select a role.';
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
      newErrors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateFields();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSubmit = {
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
    };

    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/signup/', dataToSubmit);

      if (response.status === 201) {
        setMessage('Registration successful!');
        setStep(3); // Move to success step
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      if (error.response?.data) {
        const backendErrors = error.response.data;
        const errorMessages = {};

        if (backendErrors.phone) {
          errorMessages.phone = backendErrors.phone;
        }
        if (backendErrors.password) {
          errorMessages.password = backendErrors.password;
        }

        setErrors((prev) => ({
          ...prev,
          ...errorMessages,
          form: backendErrors.error || 'An error occurred. Please try again.',
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          form: 'An unexpected error occurred. Please try again.',
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: '' }));

    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: 'Passwords do not match.',
        }));
      }
    }
  };

  const nextStep = () => {
    const fieldsToValidate = step === 1 ? ['phone', 'role'] : ['password', 'confirmPassword'];
    const stepErrors = {};
    
    fieldsToValidate.forEach(field => {
      const fieldErrors = validateField(field);
      if (fieldErrors) {
        stepErrors[field] = fieldErrors;
      }
    });

    if (Object.keys(stepErrors).length === 0) {
      setStep(step + 1);
    } else {
      setErrors(stepErrors);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const validateField = (field) => {
    switch (field) {
      case 'phone':
        return !/^(078|079|072|073)\d{7}$/.test(formData.phone) 
          ? 'Phone number must be 10 digits starting with 078, 079, 072, or 073.' 
          : null;
      case 'role':
        return formData.role === 'Choose Role' ? 'You must select a role.' : null;
      case 'password':
        return !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)
          ? 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.'
          : null;
      case 'confirmPassword':
        return formData.password !== formData.confirmPassword ? 'Passwords do not match.' : null;
      default:
        return null;
    }
  };

  // Password strength indicator
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
      text: strengthMap[strength].text, 
      color: strengthMap[strength].color 
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl mx-4">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left side - Image */}
          <div className="hidden lg:block relative">
            <img 
              src={loginImage} 
              alt="Health Connect" 
              className="object-cover h-full w-full" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 to-transparent flex flex-col justify-end p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Health Connect</h2>
              <p className="text-lg mb-6">Join our platform to connect with health workers and access better healthcare services.</p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
                  <span>Easy appointment scheduling</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
                  <span>Connect with qualified health workers</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
                  <span>Access healthcare services efficiently</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
              <p className="text-gray-600 mt-2">Join our healthcare community today</p>
            </div>

            {errors.form && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errors.form}
              </div>
            )}
            
            {step === 3 ? (
              <div className="text-center py-8">
                <div className="flex justify-center">
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h3>
                <p className="text-gray-600 mb-6">You will be redirected to the login page shortly...</p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Step indicators */}
                <div className="flex justify-center mb-6">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                    <div className={`w-16 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                  </div>
                </div>
                
                {step === 1 && (
                  <>
                    {/* Step 1: Account Type */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative">
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full text-gray-500 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="e.g., 0781234567"
                            required
                          />
                        </div>
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Select Your Role</label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full text-gray-500 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          required
                        >
                          <option value="Choose Role" disabled>Choose Role</option>
                          <option value="citizen">Citizen</option>
                          <option value="chw">Health Worker</option>
                        </select>
                        {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* Step 2: Create Password */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
                        <div className="relative">
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full text-gray-500 px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Create a strong password"
                            required
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? 
                              <EyeIcon className="h-5 w-5 text-gray-500" /> : 
                              <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                            }
                          </button>
                        </div>
                        
                        {/* Password strength indicator */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${passwordStrength.color}`} 
                              style={{ width: `${passwordStrength.strength}%` }}>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{formData.password ? `Password strength: ${passwordStrength.text}` : ''}</p>
                        </div>
                        
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full text-gray-500 px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Confirm your password"
                            required
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? 
                              <EyeIcon className="h-5 w-5 text-gray-500" /> : 
                              <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                            }
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation buttons */}
                <div className="pt-4">
                  {step === 1 ? (
                    <button
                      type="button"
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={nextStep}
                    >
                      Continue
                    </button>
                  ) : step === 2 ? (
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        className="w-1/2 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        onClick={prevStep}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 bg-indigo-600 text-white py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                            Signing up...
                          </span>
                        ) : (
                          'Create Account'
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
            
                <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Back Home
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;