// src/components/reports/InvoiceDetailView.tsx
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, MapPin, Phone } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface InvoiceDetailViewProps {
    invoiceData: {
        invoice: any;
        payments: any[];
    };
    onBack: () => void;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoiceData, onBack }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const { invoice, payments } = invoiceData;

    const handlePrint = useReactToPrint({
        documentTitle: `Invoice_${invoice.id}`,
        bodyClass: "print-body",
        // @ts-ignore
        content: () => printRef.current
    });

    if (!invoice) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
        >
            <div className="flex justify-between items-center mb-6">
                <Button onClick={onBack} variant="outline" className="gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md">
                    <ArrowLeft size={16} /> Back to List
                </Button>
                <Button onClick={handlePrint} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                    <Printer size={16} /> Download / Print PDF
                </Button>
            </div>

            <Card className="overflow-hidden border-none shadow-xl">
                <div ref={printRef} className="p-12 bg-white text-gray-900 min-h-[800px] relative">

                    {/* Header */}
                    <div className="flex justify-between items-start pb-8 border-b-2 border-gray-100">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                {/* Logo Placeholder */}
                                <div className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-2xl">C</div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Classic Offset Cards</h1>
                                    <p className="text-xs text-gray-500 font-medium">PREMIUM PRINTING SERVICES</p>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> 363, Bazar Road, Kadayanallur - 62775</p>
                                <p className="pl-6">Tenkasi District, Tamil Nadu</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black text-gray-200 tracking-wider mb-2">INVOICE</h2>
                            <p className="text-lg font-bold text-gray-900">#{invoice.id}</p>
                            <p className="text-sm text-gray-500 font-medium">Date: {new Date(invoice.created_at || invoice.date).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mt-8 grid grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
                            <p className="text-xl font-bold text-gray-900 mb-1">{invoice.customer_name}</p>
                            <p className="text-sm text-gray-600 mb-1">{invoice.customer_address || 'No address provided'}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} className="text-gray-400" /> {invoice.customer_phone || '-'}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">Project Type:</span>
                                <span className="font-bold text-gray-900">{invoice.order_type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${invoice.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        invoice.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-200 text-gray-700'
                                    }`}>{invoice.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mt-10">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="py-4 px-6 text-left font-bold rounded-l-lg">Description</th>
                                    <th className="py-4 px-6 text-center font-bold">Details</th>
                                    <th className="py-4 px-6 text-center font-bold">Quantity</th>
                                    <th className="py-4 px-6 text-right font-bold rounded-r-lg">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="py-6 px-6 font-medium text-gray-900">
                                        {invoice.order_type}
                                        <p className="text-xs text-gray-500 mt-1 font-normal">Custom print order</p>
                                    </td>
                                    <td className="py-6 px-6 text-center text-gray-600">-</td>
                                    <td className="py-6 px-6 text-center font-medium">{invoice.quantity}</td>
                                    <td className="py-6 px-6 text-right font-bold text-gray-900">₹{invoice.total_amount.toLocaleString('en-IN')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mt-10">
                        <div className="w-full max-w-sm bg-gray-50 rounded-xl p-6 space-y-3">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span className="font-medium">Subtotal</span>
                                <span>₹{invoice.total_amount.toLocaleString('en-IN')}</span>
                            </div>
                            {/* Add tax logic here if needed */}
                            <div className="flex justify-between text-gray-600 text-sm pb-3 border-b border-gray-200">
                                <span className="font-medium">Discount</span>
                                <span>- ₹0</span>
                            </div>

                            <div className="flex justify-between items-center text-lg pt-2">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="font-bold text-indigo-600">₹{invoice.total_amount.toLocaleString('en-IN')}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-green-600 font-bold uppercase mb-1">Paid</p>
                                    <p className="text-green-700 font-bold">₹{(invoice.total_amount - invoice.balance_due).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-red-600 font-bold uppercase mb-1">Balance Due</p>
                                    <p className="text-red-700 font-bold">₹{Number(invoice.balance_due).toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {payments.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-indigo-500 rounded-full"></span> Payment History
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {payments.map((p: any) => (
                                    <div key={p.id} className="border border-gray-100 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-900">₹{p.amount_paid.toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{new Date(p.payment_date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase">
                                            {p.payment_method}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="absolute bottom-12 left-12 right-12 text-center text-gray-400 text-xs">
                        <p>Thank you for your business!</p>
                        <p className="mt-1">For questions, please contact us at support@classicoffset.com</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default InvoiceDetailView;
