import React from "react";
import Modal from "../ui/Modal";
import ReportsPage from "@/pages/ReportsPage";

interface ReportDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  filters?: Record<string, any>;
}

const ReportDrilldownModal: React.FC<ReportDrilldownModalProps> = ({ isOpen, onClose, reportType, filters }) => {
  // Pass filters as needed to ReportsPage (extend ReportsPage to accept them if needed)
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detailed Report" size="3xl">
      <div className="p-2">
        <ReportsPage drilldownType={reportType} drilldownFilters={filters} isDrilldown />
      </div>
    </Modal>
  );
};

export default ReportDrilldownModal;
