import React from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { SaleItem } from '../App';
import { Printer, X } from 'lucide-react';

interface ReceiptModalProps {
  receiptNumber: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  cashierName: string;
  onClose: () => void;
}

export function ReceiptModal({
  receiptNumber,
  items,
  total,
  paymentMethod,
  cashReceived,
  change,
  cashierName,
  onClose
}: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Transaction receipt - {receiptNumber}
          </DialogDescription>
        </DialogHeader>

        <div id="receipt" className="bg-white p-6 space-y-4">
          {/* Header */}
          <div className="text-center border-b border-gray-300 pb-4">
            <h2 className="text-xl text-gray-900 mb-1">POSCart System</h2>
            <p className="text-sm text-gray-600">Alok Dixit's Business</p>
            <p className="text-xs text-gray-500">Thank you for your purchase!</p>
          </div>

          {/* Receipt Info */}
          <div className="text-sm space-y-1 border-b border-gray-300 pb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Receipt No:</span>
              <span className="text-gray-900">{receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="text-gray-900">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cashier:</span>
              <span className="text-gray-900">{cashierName}</span>
            </div>
          </div>

          {/* Items */}
          <div className="border-b border-gray-300 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600">Item</th>
                  <th className="text-center py-2 text-gray-600">Qty</th>
                  <th className="text-right py-2 text-gray-600">Price</th>
                  <th className="text-right py-2 text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{item.product_name}</td>
                    <td className="text-center py-2 text-gray-900">{item.quantity}</td>
                    <td className="text-right py-2 text-gray-900">₹{item.price.toFixed(2)}</td>
                    <td className="text-right py-2 text-gray-900">₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">₹{total.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method</span>
              <span className="text-gray-900">{paymentMethod}</span>
            </div>

            {cashReceived !== undefined && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cash Received</span>
                  <span className="text-gray-900">₹{cashReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Change</span>
                  <span className="text-gray-900">₹{change?.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-300">
            <p>This serves as your official receipt</p>
            <p className="mt-1">For concerns, please contact us</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="size-4 mr-2" />
            Print Receipt
          </Button>
          <Button onClick={onClose} className="flex-1">
            <X className="size-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}