import React, { useState } from 'react';
import ShowcaseGallery from './ShowcaseGallery';
import ProductLibrary from './ProductLibrary';
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
      {/* Product Library Section */}
      <section>
        <div className="mb-6 text-center space-y-2">
          <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
            ✨ Design Library
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of premium print products and templates.
          </p>
        </div>
        <ProductLibrary />
      </section>

      {/* Gallery Uploader Section (Admin Page க்கு நகர்த்தப்பட்டது) */}
      {/* ShowcaseGallery component இன்னும் இங்கே உள்ளது, அது படங்களை Display செய்கிறது */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
          📸 Recent Work Gallery
        </h2>
        <Card className="p-4">
          <ShowcaseGallery refreshKey={refreshKey} />
        </Card>
      </section>

      {/* Highlights Section */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
          🌟 Highlight Features
        </h2>
        <Card className="p-4">
          <HighlightFeatures />
        </Card>
      </section>

      {/* Branding Section */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
          🖋️ Why Choose Us?
        </h2>
        <Card className="p-4">
          <BrandingCopy />
        </Card>
      </section>

      {/* Testimonials Section */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
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