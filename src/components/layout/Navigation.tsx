import React from 'react';

const Navigation: React.FC = () => {
  return (
    <nav className="flex flex-col md:flex-row md:ml-auto">
      <a
        href="#home"
        className="px-4 py-2 text-white hover:bg-gray-700 active:bg-gray-900 rounded"
        style={{ minHeight: '44px' }}
      >
        Home
      </a>
      <a
        href="#about"
        className="px-4 py-2 text-white hover:bg-gray-700 active:bg-gray-900 rounded"
        style={{ minHeight: '44px' }}
      >
        About
      </a>
      <a
        href="#services"
        className="px-4 py-2 text-white hover:bg-gray-700 active:bg-gray-900 rounded"
        style={{ minHeight: '44px' }}
      >
        Services
      </a>
      <a
        href="#contact"
        className="px-4 py-2 text-white hover:bg-gray-700 active:bg-gray-900 rounded"
        style={{ minHeight: '44px' }}
      >
        Contact
      </a>
    </nav>
  );
};

export default Navigation;
