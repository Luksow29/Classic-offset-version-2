import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

// Layout
import AdminContentLayout from '../components/admin/layout/AdminContentLayout';

// Tabs
import ShowcaseTab from '../components/admin/content/ShowcaseTab';
import StaffManagementTab from '../components/admin/content/StaffManagementTab';
import OrderRequestsTab from '../components/admin/content/OrderRequestsTab';
import OtherLinksTab from '../components/admin/content/OtherLinksTab';
import TemplatesTab from '../components/admin/content/TemplatesTab';

// Modals
import FeatureFormModal from '../components/admin/FeatureFormModal';
import TestimonialFormModal from '../components/admin/TestimonialFormModal';
import GalleryItemFormModal from '../components/admin/GalleryItemFormModal';
import StaffLogFormModal from '../components/staff/StaffLogFormModal';
import EmployeeFormModal from '../components/admin/EmployeeFormModal';

export interface Template { id: string; name: string; category: string; body: string; }

const TAB_IDS = ['showcase', 'templates', 'staff_management', 'order_requests', 'others'] as const;
type TabId = (typeof TAB_IDS)[number];
const isTabId = (value: string | null): value is TabId => TAB_IDS.includes(value as TabId);

const AdminContentManagement: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = searchParams.get('tab');
    return isTabId(tab) ? tab : 'showcase';
  });

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
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  // Templates Management
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Templates Fetching
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase.from('whatsapp_templates').select('*').order('name');
      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err.message);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [fetchTemplates, refreshKey, activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isTabId(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabSelect = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const handleTemplateDataChange = () => {
    handleDataChange();
  };

  // Handlers
  const handleAddFeature = () => {
    setEditingFeature(null);
    setShowFeatureModal(true);
  };

  const handleEditFeature = (feature: any) => {
    setEditingFeature(feature);
    setShowFeatureModal(true);
  };

  const handleAddTestimonial = () => {
    setEditingTestimonial(null);
    setShowTestimonialModal(true);
  };

  const handleEditTestimonial = (testimonial: any) => {
    setEditingTestimonial(testimonial);
    setShowTestimonialModal(true);
  };

  const handleEditGalleryItem = (item: any) => {
    setEditingGalleryItem(item);
    setShowGalleryItemModal(true);
  };

  const handleAddStaffLog = () => {
    setEditingStaffLog(null);
    setShowStaffLogModal(true);
  };

  const handleEditStaffLog = (log: any) => {
    setEditingStaffLog(log);
    setShowStaffLogModal(true);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: any) => {
    setEditingEmployee(employee);
    setShowEmployeeModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'showcase':
        return (
          <ShowcaseTab
            onUploadSuccess={handleDataChange}
            onEditItem={handleEditGalleryItem}
            onDataChange={handleDataChange}
            onAddFeature={handleAddFeature}
            onEditFeature={handleEditFeature}
            onAddTestimonial={handleAddTestimonial}
            onEditTestimonial={handleEditTestimonial}
          />
        );
      case 'templates':
        return (
          <TemplatesTab
            templates={templates}
            loading={loadingTemplates}
            onDataChange={handleTemplateDataChange}
          />
        );
      case 'staff_management':
        return (
          <StaffManagementTab
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onDataChange={handleDataChange}
            onAddLog={handleAddStaffLog}
            onEditLog={handleEditStaffLog}
          />
        );
      case 'order_requests':
        return <OrderRequestsTab />;
      case 'others':
        return <OtherLinksTab />;
      default:
        return null;
    }
  };

  return (
    <>
      <AdminContentLayout activeTab={activeTab} setActiveTab={handleTabSelect}>
        {renderTabContent()}
      </AdminContentLayout>

      {/* Modals placed at the top level */}
      {showFeatureModal && (
        <FeatureFormModal
          isOpen={showFeatureModal}
          onClose={() => setShowFeatureModal(false)}
          onSave={handleDataChange}
          editingFeature={editingFeature}
        />
      )}

      {showTestimonialModal && (
        <TestimonialFormModal
          isOpen={showTestimonialModal}
          onClose={() => setShowTestimonialModal(false)}
          onSave={handleDataChange}
          editingTestimonial={editingTestimonial}
        />
      )}

      {showGalleryItemModal && (
        <GalleryItemFormModal
          isOpen={showGalleryItemModal}
          onClose={() => setShowGalleryItemModal(false)}
          onSave={handleDataChange}
          editingItem={editingGalleryItem}
        />
      )}

      {showStaffLogModal && (
        <StaffLogFormModal
          isOpen={showStaffLogModal}
          onClose={() => setShowStaffLogModal(false)}
          onSave={handleDataChange}
          editingLog={editingStaffLog}
        />
      )}

      {showEmployeeModal && (
        <EmployeeFormModal
          isOpen={showEmployeeModal}
          onClose={() => setShowEmployeeModal(false)}
          onSave={handleDataChange}
          editingEmployee={editingEmployee}
        />
      )}
    </>
  );
};

export default AdminContentManagement;
