import React from 'react';

const MainContent: React.FC = () => {
  return (
    <main className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2">Card 1</h2>
          <p>This is some example content for the first card. The layout will adjust based on the screen size.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2">Card 2</h2>
          <p>This is some example content for the second card. It uses responsive grid classes.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2">Card 3</h2>
          <p>This is some example content for the third card, demonstrating the flexible grid system.</p>
        </div>
      </div>
    </main>
  );
};

export default MainContent;
