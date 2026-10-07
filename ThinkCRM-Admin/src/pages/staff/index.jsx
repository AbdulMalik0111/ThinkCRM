import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Tooltip from "@/components/ui/Tooltip";
import Pagination from "@/components/ui/Pagination";
import AdminListToolbar from "@/components/shared/AdminListToolbar";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSuspendStaffMutation,
  useReactivateStaffMutation,
  useResetStaffPasswordMutation,
  useGetStaffActivityQuery,
  useDeleteStaffMutation,
  useGetPermissionsRegistryQuery,
} from "@/store/api/management/managementApiSlice";
import dayjs from "dayjs";
import Checkbox from "@/components/ui/Checkbox";
import Radio from "@/components/ui/Radio";

const StaffActivity = ({ staffId }) => {
  const { data, isLoading } = useGetStaffActivityQuery({ id: staffId });
  if (isLoading) return <div>Loading activity...</div>;
  const activities = data?.data?.activity || [];

  if (activities.length === 0) return <div>No activity found for this staff member.</div>;

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.map((act) => (
        <div key={act._id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
          <p className="text-sm font-semibold">{act.action} - {act.entityType}</p>
          <p className="text-xs text-slate-500">{dayjs(act.createdAt).format("DD MMM YYYY, hh:mm A")}</p>
          <pre className="text-xs mt-1 text-slate-600 dark:text-slate-300">
            {JSON.stringify(act.details, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};

const Staff = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "";

  const updateParams = (newParams) => {
    const current = Object.fromEntries(searchParams);
    const updated = { ...current, ...newParams };
    Object.keys(updated).forEach(key => {
      if (updated[key] === "" || updated[key] === null || (key === 'page' && updated[key] === 1)) {
        delete updated[key];
      }
    });
    setSearchParams(updated);
  };

  const { data, isLoading, error } = useGetStaffQuery({
    page,
    limit: 50,
    search,
    status: statusFilter
  });
  const staffList = data?.data?.staff || [];
  const totalPages = data?.data?.totalPages || 1;

  const [suspendStaff] = useSuspendStaffMutation();
  const [reactivateStaff] = useReactivateStaffMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetStaffPasswordMutation();
  const [deleteStaff] = useDeleteStaffMutation();

  const [showActivity, setShowActivity] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ show: false, action: null, message: "", title: "" });

  const location = useLocation();
  const navigate = useNavigate();


  const handleSuspend = async (id, status) => {
    try {
      if (status === 'active') {
        await suspendStaff(id).unwrap();
        toast.success("Staff suspended");
      } else {
        await reactivateStaff(id).unwrap();
        toast.success("Staff reactivated");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  const handleResetPassword = (id) => {
    setConfirmAction({
      show: true,
      title: "Reset Password",
      message: "Are you sure you want to reset this staff member's password? It will invalidate their current sessions.",
      action: async () => {
        try {
          const res = await resetPassword(id).unwrap();
          toast.success(`Password reset successful! Temp password: ${res.data.tempPassword}`, {
            autoClose: false // Keep open so admin can copy it
          });
        } catch (err) {
          toast.error(err?.data?.message || "Failed to reset password");
        }
        setConfirmAction({ show: false, action: null, message: "", title: "" });
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmAction({
      show: true,
      title: "Delete Staff",
      message: "Are you sure you want to delete this staff member? This action cannot be undone.",
      action: async () => {
        try {
          await deleteStaff(id).unwrap();
          toast.success("Staff deleted successfully");
        } catch (err) {
          toast.error(err?.data?.message || "Failed to delete staff");
        }
        setConfirmAction({ show: false, action: null, message: "", title: "" });
      }
    });
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message="Error loading staff members" />;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h4 className="text-xl font-semibold text-slate-900 dark:text-white">Staff Management</h4>
        <Button text="Add Staff" onClick={() => navigate('/staff/new')} className="btn-primary" icon="heroicons-outline:plus" />
      </div>

      <AdminListToolbar 
        searchQuery={search}
        onSearchChange={(val) => updateParams({ search: val, page: 1 })}
        searchPlaceholder="Search staff name, email or role..."
        filters={[
          {
            value: statusFilter,
            onChange: (val) => updateParams({ status: val, page: 1 }),
            options: [
              { value: "", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" }
            ]
          }
        ]}
        onReset={() => setSearchParams({})}
      />

      <Card noborder>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="table-th">Name</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Role</th>
                    <th className="table-th">Permissions</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                  {staffList.map((item) => (
                    <tr key={item._id}>
                      <td className="table-td">{item.firstName} {item.lastName}</td>
                      <td className="table-td">{item.email}</td>
                      <td className="table-td">{item.role}</td>
                      <td className="table-td">
                        {item.permissionMode === 'CUSTOM' ? (
                          <Badge label="Custom" className="bg-info-500 text-white" />
                        ) : (
                          <Badge label="Inherited" className="bg-secondary-500 text-white" />
                        )}
                      </td>
                      <td className="table-td">
                        <Badge label={item.status} className={item.status === 'active' ? 'bg-success-500 text-white' : item.status === 'suspended' ? 'bg-warning-500 text-white' : 'bg-danger-500 text-white'} />
                      </td>
                      <td className="table-td p-4 text-center">
                        <div className="flex space-x-3 rtl:space-x-reverse">
                          <Tooltip content="Edit" placement="top">
                            <button className="action-btn text-lg" onClick={() => navigate(`/staff/${item._id}/edit`, { state: { staff: item } })}>
                              <Icon icon="heroicons:pencil-square" />
                            </button>
                          </Tooltip>
                          <Tooltip content={item.status === 'active' ? "Suspend" : "Reactivate"} placement="top">
                            <button className="action-btn text-lg" onClick={() => handleSuspend(item._id, item.status)} disabled={item.status === 'disabled'}>
                              <Icon icon={item.status === 'active' ? "heroicons:no-symbol" : "heroicons:check-circle"} className={item.status === 'active' ? "text-warning-500" : "text-success-500"} />
                            </button>
                          </Tooltip>
                          <Tooltip content="Reset Password" placement="top">
                            <button className="action-btn text-lg" onClick={() => handleResetPassword(item._id)} disabled={item.status === 'disabled' || item.status === 'suspended'}>
                              <Icon icon="heroicons:key" />
                            </button>
                          </Tooltip>
                          <Tooltip content="View Activity" placement="top">
                            <button className="action-btn text-lg" onClick={() => { setSelectedStaff(item); setShowActivity(true); }}>
                              <Icon icon="heroicons:list-bullet" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete" placement="top">
                            <button className="action-btn text-lg" onClick={() => handleDelete(item._id)} disabled={item.status === 'disabled'}>
                              <Icon icon="heroicons:trash" className="text-danger-500" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {staffList.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-0">
                        <EmptyState 
                          title="No staff members found" 
                          description="No staff members matching your criteria." 
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              handlePageChange={(newPage) => updateParams({ page: newPage })}
            />
          </div>
        )}
      </Card>


      <Modal
        activeModal={showActivity}
        onClose={() => setShowActivity(false)}
        title={`Activity: ${selectedStaff?.firstName}`}
        themeClass="bg-slate-900"
        centered={true}
      >
        {selectedStaff && <StaffActivity staffId={selectedStaff._id} />}
      </Modal>

      <Modal
        activeModal={confirmAction.show}
        onClose={() => setConfirmAction({ show: false, action: null, message: "", title: "" })}
        title={confirmAction.title}
        themeClass="bg-slate-900"
        centered={true}
      >
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{confirmAction.message}</p>
        <div className="flex justify-end space-x-3 mt-6">
          <Button text="Cancel" className="btn-light" onClick={() => setConfirmAction({ show: false, action: null, message: "", title: "" })} />
          <Button text="Confirm" className="btn-danger" onClick={confirmAction.action} />
        </div>
      </Modal>
    </div>
  );
};

export default Staff;
