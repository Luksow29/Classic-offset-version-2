
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// Correctly import individual icons from lucide-react to enable tree-shaking
import Image from 'lucide-react/dist/esm/icons/image';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Users from 'lucide-react/dist/esm/icons/users';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Plus from 'lucide-react/dist/esm/icons/plus';
import UserCog from 'lucide-react/dist/esm/icons/user-cog';
import Package from 'lucide-react/dist/esm/icons/package';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import Warehouse from 'lucide-react/dist/esm/icons/warehouse';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import Banknote from 'lucide-react/dist/esm/icons/banknote';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import Layers from 'lucide-react/dist/esm/icons/layers';
import { ClipboardList } from 'lucide-react';


import FeatureFormModal from '../components/admin/FeatureFormModal';
import FeaturesTable from '../components/admin/FeaturesTable';
import BrandingContentForm from '../components/admin/BrandingContentForm';
import TestimonialFormModal from '../components/admin/TestimonialFormModal';
import TestimonialsTable from '../components/admin/TestimonialsTable';
import { Link } from 'react-router-dom';
import GalleryUploader from '../components/showcase/GalleryUploader';
import GalleryItemsTable from '../components/admin/GalleryItemsTable';
import GalleryItemFormModal from '../components/admin/GalleryItemFormModal';

import { AnimatePresence, motion } from 'framer-motion';

// import TemplateManager from '../components/whatsapp/TemplateManager';
import { supabase } from '@/lib/supabaseClient';

// Staff Management Components
import StaffLogFormModal from '../components/staff/StaffLogFormModal';
import StaffLogsTable from '../components/admin/StaffLogsTable';
import StaffMembersTable from '../components/admin/StaffMembersTable';
import EmployeeFormModal from '../components/admin/EmployeeFormModal'; // NEW: EmployeeFormModal ஐ இறக்குமதி செய்யவும்
import OrderRequestsTable from '../components/admin/OrderRequestsTable';


interface Template { id: string; name: string; category: string; body: string; }

const AdminContentManagement: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'showcase' | 'templates' | 'staff_management' | 'order_requests' | 'others'>('showcase');

  // Feature Modals
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any | null>(null);

  // Testimonial Modals
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any | null>(null);

  // Gallery Item Modals
  const [showGalleryItemModal, setShowGalleryItemModal] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<any | null>(null);

  // Staff Log Modals
  const [showStaffLogModal, setShowStaffLogModal] = useState(false);
  const [editingStaffLog, setEditingStaffLog] = useState<any | null>(null);

  // Employee Management Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false); // NEW
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null); // NEW

  // Templates Management
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Templates ஐப் பெறுவதற்கான ஃபங்ஷன்
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    setTemplateError(null);
    try {
      const { data, error } = await supabase.from('whatsapp_templates').select('*').order('name');
      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching templates for Admin:', err.message);
      setTemplateError('Failed to load templates.');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, refreshKey]);

  // Feature Handlers
  const handleAddFeature = () => {
    setEditingFeature(null);
    setShowFeatureModal(true);
  };

  const handleEditFeature = (feature: any) => {
    setEditingFeature(feature);
    setShowFeatureModal(true);
  };

  // Testimonial Handlers
  const handleAddTestimonial = () => {
    setEditingTestimonial(null);
    setShowTestimonialModal(true);
  };

  const handleEditTestimonial = (testimonial: any) => {
    setEditingTestimonial(testimonial);
    setShowTestimonialModal(true);
  };

  // Gallery Item Handlers
  const handleEditGalleryItem = (item: any) => {
    setEditingGalleryItem(item);
    setShowGalleryItemModal(true);
  };

  const handleUploadSuccess = () => {
    handleDataChange();
  };

  // TemplateManager க்கான onDataChange Handler
  const handleTemplateDataChange = () => {
    handleDataChange();
  };

  // Staff Log Handlers
  const handleAddStaffLog = () => {
    setEditingStaffLog(null);
    setShowStaffLogModal(true);
  };

  const handleEditStaffLog = (log: any) => {
    setEditingStaffLog(log);
    setShowStaffLogModal(true);
  };

  // Employee Management Handlers (NEW)
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: any) => {
    setEditingEmployee(employee);
    setShowEmployeeModal(true);
  };


  // Tabs for navigation
  const tabs = [
    { id: 'showcase', label: 'Showcase Content', icon: Image },
    { id: 'templates', label: 'Template Management', icon: FileText },
    { id: 'staff_management', label: 'Staff Management', icon: Users },
    { id: 'order_requests', label: 'Order Requests', icon: ClipboardList },
    { id: 'others', label: 'Other Admin Links', icon: Settings },
  ];

  // Conditional render based on activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'showcase':
        return (
          <motion.div
            key="showcase-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Gallery Management Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Gallery Management</h2>
              <GalleryUploader onUploadSuccess={handleUploadSuccess} />
              <GalleryItemsTable onEditItem={handleEditGalleryItem} onDataChange={handleDataChange} />
            </section>

            {/* Highlight Features Management Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Highlight Features</h2>
                <Button onClick={handleAddFeature} variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Feature
                </Button>
              </div>
              <FeaturesTable onEditFeature={handleEditFeature} onDataChange={handleDataChange} />
            </section>

            {/* Branding Copy Management Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Branding Copy</h2>
              <BrandingContentForm sectionName="BrandingCopyMain" />
            </section>

            {/* Testimonials Management Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Client Testimonials</h2>
                <Button onClick={handleAddTestimonial} variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Testimonial
                </Button>
              </div>
              <TestimonialsTable onEditTestimonial={handleEditTestimonial} onDataChange={handleDataChange} />
            </section>
          </motion.div>
        );

      case 'templates':
        return (
          <motion.div
            key="templates-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* WhatsApp Templates Management Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">WhatsApp Templates Management</h2>
              {/* <TemplateManager initialTemplates={templates} onDataChange={handleTemplateDataChange} /> */}
            </section>
          </motion.div>
        );

      case 'staff_management':
        return (
          <motion.div
            key="staff-management-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Staff Members List */}
            <section className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Employee Roster</h2> {/* Changed title */}
                <Button onClick={handleAddEmployee} variant="primary" size="sm"> {/* Add Employee button */}
                  <Plus className="w-4 h-4 mr-2" /> Add Employee
                </Button>
              </div>
              <StaffMembersTable onAddEmployee={handleAddEmployee} onEditEmployee={handleEditEmployee} onDataChange={handleDataChange} /> {/* Pass handlers */}
            </section>

            {/* Staff Work Logs Management */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Staff Work Logs</h2>
              <Button onClick={handleAddStaffLog} variant="primary" size="sm" className="mb-4">
                <Plus className="w-4 h-4 mr-2" /> Add Work Log
              </Button>
              <StaffLogsTable onAddLog={handleAddStaffLog} onEditLog={handleEditStaffLog} onDataChange={handleDataChange} />
            </section>
          </motion.div>
        );

      case 'order_requests':
        return (
          <motion.div
            key="order-requests-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Order Requests</h2>
              <OrderRequestsTable />
            </section>
          </motion.div>
        );

      case 'others':
        return (
          <motion.div
            key="other-links-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Admin Links Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Other Admin Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Link to Users Management */}
                <Link to="/users" className="block">
                  <Card className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">User Management</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage user accounts & roles.</p>
                      </div>
                    </div>
                    <UserCog className="w-5 h-5 text-gray-400" />
                  </Card>
                </Link>

                {/* Link to Product Master */}
                <Link to="/products" className="block">
                  <Card className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Product Master</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage products/services.</p>
                      </div>
                    </div>
                    <ShoppingCart className="w-5 h-5 text-gray-400" />
                  </Card>
                </Link>

                {/* Link to Stock Management */}
                <Link to="/stock" className="block">
                  <Card className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Warehouse className="w-6 h-6 text-orange-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Stock Management</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track inventory levels.</p>
                      </div>
                    </div>
                    <Boxes className="w-5 h-5 text-gray-400" />
                  </Card>
                </Link>

                {/* Link to Due Summary */}
                <Link to="/due-summary" className="block">
                  <Card className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Banknote className="w-6 h-6 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Due Summary</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View pending payments.</p>
                      </div>
                    </div>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </Card>
                </Link>

                {/* Link to Expenses */}
                <Link to="/expenses" className="block">
                  <Card className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Expenses</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage business expenditures.</p>
                      </div>
                    </div>
                    <Receipt className="w-5 h-5 text-gray-400" />
                  </Card>
                </Link>

                {/* Link to Materials */}
                <Link to="/materials" className="block">
                  <Card className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Wrench className="w-6 h-6 text-cyan-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Materials</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage raw materials.</p>
                      </div>
                    </div>
                    <Layers className="w-5 h-5 text-gray-400" />
                  </Card>
                </Link>
              </div>
            </section>
          </motion.div>
        );

      default:
        return null;
    }
  };


  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Admin Content Management</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Manage dynamic content for your website sections.</p>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2
                  ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Feature Add/Edit Modal */}
      {showFeatureModal && (
        <FeatureFormModal
          isOpen={showFeatureModal}
          onClose={() => setShowFeatureModal(false)}
          onSave={handleDataChange}
          editingFeature={editingFeature}
        />
      )}

      {/* Testimonial Add/Edit Modal */}
      {showTestimonialModal && (
        <TestimonialFormModal
          isOpen={showTestimonialModal}
          onClose={() => setShowTestimonialModal(false)}
          onSave={handleDataChange}
          editingTestimonial={editingTestimonial}

        />
      )}

      {/* Gallery Item Add/Edit Modal */}
      {showGalleryItemModal && (
        <GalleryItemFormModal
          isOpen={showGalleryItemModal}
          onClose={() => setShowGalleryItemModal(false)}
          onSave={handleDataChange}
          editingItem={editingGalleryItem}
        />
      )}
      {/* Staff Log Add/Edit Modal */}
      {showStaffLogModal && (
        <StaffLogFormModal
          isOpen={showStaffLogModal}
          onClose={() => setShowStaffLogModal(false)}
          onSave={handleDataChange}
          editingLog={editingStaffLog}
        />
      )}
      {/* NEW: Employee Form Modal */}
      {showEmployeeModal && (
        <EmployeeFormModal
          isOpen={showEmployeeModal}
          onClose={() => setShowEmployeeModal(false)}
          onSave={handleDataChange}
          editingEmployee={editingEmployee}
        />
      )}
    </div>
  );
};

export default AdminContentManagement;
