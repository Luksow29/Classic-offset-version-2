import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import SafeImage from '../ui/SafeImage';

interface OrderDetails {
  id: number;
  date: string;
  total_amount: number;
  paid: number;
  balance: number;
  order_type?: string;
  quantity?: number;
  customer: {
    name: string;
    phone: string;
    address: string | null;
    code?: string | null;
  } | null;
  payments?: {
    date: string;
    amount: number;
    method: string;
    id: string;
  }[];
}

interface InvoiceViewProps {
  order: OrderDetails;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ order }) => {
  const { customer } = order;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto rounded-none sm:rounded-lg" id="invoice-component">
      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-primary-100 pb-8 mb-8">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-4 mb-4">
            <SafeImage
              src="/classic-offset-logo.jpg"
              alt="Classic Offset Logo"
              className="w-20 h-20 object-contain rounded-full shadow-sm"
            />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Classic Offset And Cards</h1>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-primary" />
              <span>363, Bazar Road, Kadayanallur - 627755</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Tenkasi District - Tamil Nadu</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-primary" />
              <span>+91 98425 78847</span>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-0 text-right">
          <h2 className="text-4xl font-extrabold text-gray-100 uppercase tracking-widest relative">
            INVOICE
            <span className="absolute top-1/2 left-0 -translate-y-1/2 text-lg text-primary font-bold ml-1">#{order.id}</span>
          </h2>
          <div className="mt-4 space-y-1">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">Date:</span> {new Date(order.date).toLocaleDateString('en-GB')}
            </p>
            {/* Add Due Date if available */}
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Bill To</h3>
          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-900">{customer?.name || 'Walk-in Customer'}</p>
            {customer?.code && <p className="text-sm text-gray-500 font-mono bg-white px-2 py-0.5 rounded inline-block border border-gray-200">ID: {customer.code}</p>}
            {customer?.address && <p className="text-gray-600 text-sm mt-2">{customer.address}</p>}
            {customer?.phone && <p className="text-gray-600 text-sm flex items-center gap-2 mt-1"><Phone size={12} /> {customer.phone}</p>}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col justify-between">
          {order.payments && order.payments.length > 0 ? (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment History</h4>
              <div className="overflow-hidden rounded border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {order.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-600">{new Date(payment.date).toLocaleDateString('en-GB')}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-600 capitalize">{payment.method}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Info</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Bank:</span> State Bank of India</p>
                <p><span className="font-medium">A/C No:</span> XXXXXXXXX1234</p>
                <p><span className="font-medium">IFSC:</span> SBIN000XXXX</p>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">GPay</span>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-medium">PhonePe</span>
                  <span className="font-bold text-gray-800 text-base ml-1">+91 98425 78847</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end items-end">
            <div className="text-right">
              <div className="h-8"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider">Description</th>
              <th className="py-4 px-6 text-right text-xs font-bold uppercase tracking-wider w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-6 px-6">
                <p className="font-semibold text-gray-900 text-lg">{order.order_type || 'Job Order'}</p>
                <div className="text-sm text-gray-500 mt-1 space-y-1">
                  <p>Order ID: #{order.id}</p>
                  {order.quantity && <p>Quantity: {order.quantity}</p>}
                </div>
              </td>
              <td className="py-6 px-6 text-right font-medium text-gray-900">
                ₹{(order.total_amount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>


      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-full sm:w-1/2 lg:w-1/3 space-y-3">
          <div className="flex justify-between py-2 text-gray-600">
            <span>Subtotal</span>
            <span>₹{(order.total_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-3 border-t border-gray-100 text-gray-900">
            <span className="font-medium">Total (INR)</span>
            <span className="font-bold">₹{(order.total_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-2 text-green-600">
            <span>Amount Paid</span>
            <span>- ₹{(order.paid || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className={`flex justify-between py-4 border-t-2 border-gray-200 text-lg ${order.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            <span className="font-extrabold">Balance Due</span>
            <span className="font-extrabold">₹{(order.balance || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-8 text-center">
        <p className="text-gray-900 font-medium mb-2">Thank you for your business!</p>
        <p className="text-sm text-gray-500">Should you have any enquiries concerning this invoice, please contact us at +91 98425 78847</p>
      </div>
    </div>
  );
};

export default InvoiceView;
