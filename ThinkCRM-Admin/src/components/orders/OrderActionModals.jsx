import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";

export const CancelOrderModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason, note.trim() || undefined);
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Cancel Order"
      centered
    >
      <div className="space-y-4 text-slate-700 dark:text-slate-300">
        <p className="text-sm">
          Are you sure you want to cancel this order? This action will release reserved stock or route to quarantine if processing.
          If the order is paid, a refund will automatically be queued.
        </p>
        <Textarea
          label="Cancellation Reason (Required)"
          placeholder="Enter the reason for cancellation (e.g. Customer request, Suspected fraud, Pricing error)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <Textinput
          label="Internal note (Optional — visible only to staff)"
          placeholder="Staff context / reference number"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-outline-dark" onClick={onClose} disabled={isLoading}>
            Close
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleConfirm} 
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const RejectPrescriptionModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Reject Prescription"
      centered
    >
      <div className="space-y-4 text-slate-700 dark:text-slate-300">
        <p className="text-sm">
          Are you sure you want to reject this prescription? This will reject the order.
        </p>
        <Textarea
          label="Rejection Reason"
          placeholder="Please explain why the prescription is invalid"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-outline-dark" onClick={onClose} disabled={isLoading}>
            Close
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleConfirm} 
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const ReturnReviewModal = ({ isOpen, onClose, onConfirm, isLoading, order }) => {
  const [reason, setReason] = useState("");
  const [defaultCondition, setDefaultCondition] = useState("RESALABLE");
  
  // Item-level selection state: { [itemId]: { selected: boolean, quantity: number, condition: string } }
  const [itemSelections, setItemSelections] = useState(() => {
    const initial = {};
    if (order?.items) {
      order.items.forEach(item => {
        const availableToReturn = item.requestedQuantity - (item.returnedQuantity || 0);
        initial[item._id] = {
          selected: true,
          quantity: availableToReturn,
          maxQuantity: availableToReturn,
          condition: "RESALABLE"
        };
      });
    }
    return initial;
  });

  const handleQuantityChange = (itemId, val, max) => {
    const num = Math.max(1, Math.min(max, parseInt(val, 10) || 1));
    setItemSelections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: num }
    }));
  };

  const handleConditionChange = (itemId, condition) => {
    setItemSelections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], condition }
    }));
  };

  const handleToggleSelect = (itemId) => {
    setItemSelections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: !prev[itemId]?.selected }
    }));
  };

  const handleApprove = () => {
    if (!reason.trim()) return;
    
    // Construct itemsToReturn array
    const itemsToReturn = Object.entries(itemSelections)
      .filter(([_, sel]) => sel.selected && sel.quantity > 0)
      .map(([itemId, sel]) => ({
        itemId,
        quantity: sel.quantity,
        condition: sel.condition || defaultCondition
      }));

    if (itemsToReturn.length === 0) return;

    onConfirm("APPROVE", reason, defaultCondition, itemsToReturn);
  };

  const handleReject = () => {
    if (!reason.trim()) return;
    onConfirm("REJECT", reason);
  };

  const hasSelectedItems = Object.values(itemSelections).some(s => s.selected && s.quantity > 0);

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Review Return Request"
      centered
      className="max-w-2xl"
    >
      <div className="space-y-4 text-slate-700 dark:text-slate-300">
        <p className="text-sm">
          Select items to return, their quantities, and assign a stock condition disposition.
        </p>

        {/* Item-level Selector */}
        {order?.items && order.items.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden text-sm">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left">Select</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Qty</th>
                  <th className="px-3 py-2 text-left">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {order.items.map(item => {
                  const sel = itemSelections[item._id] || { selected: false, quantity: item.requestedQuantity, maxQuantity: item.requestedQuantity, condition: "RESALABLE" };
                  return (
                    <tr key={item._id} className={sel.selected ? "bg-primary-50/40 dark:bg-primary-900/10" : ""}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={sel.selected}
                          onChange={() => handleToggleSelect(item._id)}
                          className="rounded text-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                        {item.productName}
                        <div className="text-xs text-slate-500">Ordered: {item.requestedQuantity}</div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          max={sel.maxQuantity}
                          value={sel.quantity}
                          disabled={!sel.selected}
                          onChange={(e) => handleQuantityChange(item._id, e.target.value, sel.maxQuantity)}
                          className="w-16 px-2 py-1 border rounded text-center dark:bg-slate-800 dark:border-slate-600"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={sel.condition}
                          disabled={!sel.selected}
                          onChange={(e) => handleConditionChange(item._id, e.target.value)}
                          className="px-2 py-1 border rounded text-xs dark:bg-slate-800 dark:border-slate-600"
                        >
                          <option value="RESALABLE">Resalable (Restock)</option>
                          <option value="DAMAGED">Damaged (Waste)</option>
                          <option value="UNSELLABLE">Unsellable (Waste)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Textarea
          label="Decision Reason / Notes"
          placeholder="Enter notes for this return decision"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-outline-dark" onClick={onClose} disabled={isLoading}>
            Close
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleReject} 
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? "Processing..." : "Reject Return"}
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleApprove} 
            disabled={!reason.trim() || !hasSelectedItems || isLoading}
          >
            {isLoading ? "Processing..." : "Approve Return"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const RefundModal = ({ isOpen, onClose, onConfirm, isLoading, order }) => {
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("UPI");
  const [refundReference, setRefundReference] = useState("");

  const isCOD = order?.paymentMethod === 'COD';

  const handleConfirm = () => {
    if (!reason.trim()) return;
    if (isCOD && (!refundMethod || !refundReference.trim())) return;
    onConfirm(reason, refundMethod, refundReference);
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title={isCOD ? "Initiate Manual COD Refund" : "Initiate Online Refund"}
      centered
    >
      <div className="space-y-4 text-slate-700 dark:text-slate-300">
        {isCOD ? (
          <div className="bg-warning-100 text-warning-800 p-4 rounded-md text-sm mb-4">
            <strong>Note:</strong> Since this was a COD order, you must process the refund manually (e.g. via UPI or Bank Transfer) outside of the system, and record the reference below.
          </div>
        ) : (
          <div className="bg-warning-100 text-warning-800 p-4 rounded-md text-sm mb-4">
            <strong>Note:</strong> The refund amount will be automatically calculated by the backend based on the original captured amount. You are only initiating the request to the payment gateway.
          </div>
        )}
        <Textarea
          label="Refund Reason"
          placeholder="Enter reason for this manual refund"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        
        {isCOD && (
          <>
            <div>
              <label className="form-label">Refund Method</label>
              <select 
                className="form-control" 
                value={refundMethod} 
                onChange={(e) => setRefundMethod(e.target.value)}
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <Textinput
              label="Transaction Reference"
              type="text"
              placeholder="e.g. UPI Ref Number or UTR"
              value={refundReference}
              onChange={(e) => setRefundReference(e.target.value)}
              required={isCOD}
            />
          </>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-outline-dark" onClick={onClose} disabled={isLoading}>
            Close
          </button>
          <button 
            className="btn bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium shadow-sm" 
            onClick={handleConfirm} 
            disabled={!reason.trim() || (isCOD && (!refundMethod || !refundReference.trim())) || isLoading}
          >
            {isLoading ? "Initiating..." : "Confirm & Process Refund"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
