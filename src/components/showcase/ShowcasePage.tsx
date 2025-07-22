import React, { useState } from 'react';
// CORRECTED PATH: ShowcaseGallery, HighlightFeatures, BrandingCopy, Testimonials க்கான பாதைகளை மாற்றவும்
import ShowcaseGallery from './ShowcaseGallery'; 
import HighlightFeatures from './HighlightFeatures';
import BrandingCopy from './BrandingCopy';
import Testimonials from './Testimonials';
import Card from '../ui/Card'; 

const ShowcasePage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1); 
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 space-y-12">
      {/* Gallery Uploader Section (Admin Page க்கு நகர்த்தப்பட்டது) */}
      {/* ShowcaseGallery component இன்னும் இங்கே உள்ளது, அது படங்களை Display செய்கிறது */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          📸 Our Gallery
        </h2>
        <Card className="p-4">
          <ShowcaseGallery refreshKey={refreshKey} />
        </Card>
      </section>

      {/* Highlights Section */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          🌟 Highlight Features
        </h2>
        <Card className="p-4">
          <HighlightFeatures />
        </Card>
      </section>

      {/* Branding Section */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          🖋️ Why Choose Us?
        </h2>
        <Card className="p-4">
          <BrandingCopy />
        </Card>
      </section>

      {/* Testimonials Section */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          💬 Client Praise
        </h2>
        <Card className="p-4">
          <Testimonials />
        </Card>
      </section>
    </div>
  );
};

export default ShowcasePage;