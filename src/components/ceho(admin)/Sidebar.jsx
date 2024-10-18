/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { FaUsers } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { BiSolidInstitution } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import Logo from '../../assets/pictures/logo_lil.jpeg';
import { FcDepartment } from 'react-icons/fc';

function Sidebar() {
  const [activeLink, setActiveLink] = useState(null);

  const handleLinkClick = (index) => {
    setActiveLink(index);
  };

  const Sidebar_Links = [
    { id: 1, name: 'Dashboard', path: '/admin', icon: <MdDashboard /> },
    { id: 2, name: 'Users', path: '/admin/users', icon: <FaUsers /> },
    { id: 3, name: 'Training', path: '/admin/training', icon: <FaUsers /> },
    { id: 4, name: 'CHW', path: '/admin/worker', icon: <FaUsers /> },
    { id: 5, name: 'Training Candidates', path: '/admin/learner', icon: <FaUsers /> },
    { id: 6, name: 'Exam', path: '/admin/exams', icon: <BiSolidInstitution /> },
    { id: 7, name: 'Reports', path: '/admin/reports', icon: <FcDepartment /> },
    { id: 8, name: 'Exam Results', path: '/admin/results', icon: <FcDepartment /> },
    { id: 9, name: 'Activities', path: '/admin/activities', icon: <FcDepartment /> },
    { id: 10, name: 'Appointments', path: '/admin/appointments', icon: <FcDepartment /> },
  ];

  return (
    <div className="w-16 md:w-56 fixed left-0 top-0 z-10 h-screen bg-white shadow-md overflow-y-auto">
      <div className="mb-8 flex justify-center md:block">
        <img src={Logo} alt="Logo" className="w-10 md:w-20" />
      </div>
      <ul className="mt-6 space-y-6">
        {Sidebar_Links.map((link, index) => (
          <li key={index} className="relative">
            <div
              className={`font-medium rounded-md py-2 px-5 hover:bg-gray-100 hover:text-indigo-500 ${activeLink === index ? 'bg-indigo-100 text-indigo-500' : ''}`}
              onClick={() => handleLinkClick(index)}
            >
              <div className="flex items-center justify-between">
                <Link to={link.path || '#'} className="flex items-center justify-center md:justify-start md:space-x-5">
                  <span className="text-indigo-500">{link.icon}</span>
                  <span className="text-sm text-gray-500 md:flex hidden">{link.name}</span>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {/* <div className="w-full absolute bottom-5 left-0 px-4 py-4 text-center cursor-pointer">
        <p className="flex space-x-2 text-xs text-white py-2 px-5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full">
          <span>?</span><span>Need help</span>
        </p>
      </div> */}
    </div>
  );
}

export default Sidebar;