import React from 'react';

interface OrderDetails {
  id: number;
  date: string;
  total_amount: number;
  paid: number;
  balance: number;
  customer: {
    name: string;
    phone: string;
    address: string;
  } | null;
}

interface InvoiceViewProps {
  order: OrderDetails;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ order }) => {
  const { customer } = order;

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
          <p className="text-sm text-gray-600">#{order.id}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            Date: {new Date(order.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Bill To:</h2>
          <p className="text-gray-700">{customer?.name}</p>
          <p className="text-gray-600">{customer?.address}</p>
          <p className="text-gray-600">Phone: {customer?.phone}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-gray-800">From:</h2>
          <p className="text-gray-700">Classic Offset and cards</p>
          <p className="text-gray-600">363, bazar road, kadayanallur -62775</p>
          <p className="text-gray-600">Tenkasi District - Tamil Nadu</p>
          <p className="text-gray-600">Phone: +91 98425 78847</p>
        </div>
      </div>

      <div className="mb-8">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-2 px-4 text-left border-b">Description</th>
              <th className="py-2 px-4 text-right border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b text-gray-800">
                Order #{order.id} Details
              </td>
              <td className="py-2 px-4 text-right border-b text-gray-800">
                ₹{order.total_amount.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-full max-w-xs">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold text-gray-800">
              ₹{order.total_amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Amount Paid:</span>
            <span className="font-semibold text-green-600">
              ₹{order.paid.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg border-b-4 border-gray-300">
            <span className="text-gray-800">Balance Due:</span>
            <span className={order.balance > 0 ? 'text-red-600' : 'text-green-600'}>
              ₹{order.balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
        <p>Classic Offset - Your trusted printing partner.</p>
      </div>
    </div>
  );
};

export default InvoiceView;
