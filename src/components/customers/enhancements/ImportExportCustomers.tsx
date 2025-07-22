// src/components/customers/enhancements/ImportExportCustomers.tsx
import React from 'react';
import toast from 'react-hot-toast';

const ImportExportCustomers: React.FC = () => {
  const handleExport = () => {
    try {
      // In a real app, you would fetch actual customer data.
      // This is placeholder data.
      const csvHeader = "Name,Email,Phone,Address,JoinedDate,Tags";
      const csvRows = [
        "John Doe,john@example.com,123-456-7890,123 Main St,2023-01-15,VIP;New",
        "Jane Smith,jane@example.com,987-654-3210,456 Oak Ave,2023-02-20,Wholesale"
      ];

      // FIX: Correctly join the header and rows with the newline escape character.
      const csvString = [csvHeader, ...csvRows].join('\n');
      
      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
      
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", "customers.csv");
      document.body.appendChild(link); // Required for Firefox
      
      link.click();
      
      document.body.removeChild(link);
      toast.success('Customer data exported!');

    } catch (error) {
        console.error("Failed to export customers:", error);
        toast.error('Could not export customer data.');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real application, you would parse the CSV file and process the data
      // using a library like Papaparse.
      toast.success(`File "${file.name}" selected. Import processing would happen here.`);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer text-sm font-medium">
        <span>Import</span>
        <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
      </label>
      <button 
        onClick={handleExport}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
      >
        Export
      </button>
    </div>
  );
};

export default ImportExportCustomers;
