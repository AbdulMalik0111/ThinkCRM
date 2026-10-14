import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Tooltip from "@/components/ui/Tooltip";
import AdminListToolbar from "@/components/shared/AdminListToolbar";
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

// Shared Grid & Action Components
import DataGrid from "@/components/ui/DataGrid";
import RowActions from "@/components/ui/RowActions";
import QuickViewDrawer from "@/components/ui/QuickViewDrawer";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getAvatarColor, renderStatusPill } from "@/components/common/tableUtils";

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

  const { data, isLoading, error, refetch } = useGetStaffQuery({
    page,
    limit: 50,
    search,
    status: statusFilter
  });
  const staffList = data?.data?.users || [];
  const totalPages = data?.data?.totalPages || 1;

  const [suspendStaff] = useSuspendStaffMutation();
  const [reactivateStaff] = useReactivateStaffMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetStaffPasswordMutation();
  const [deleteStaff] = useDeleteStaffMutation();

  const [showActivity, setShowActivity] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ show: false, action: null, message: "", title: "" });

  // Quick View, Delete & Suspend State
  const [quickViewStaff, setQuickViewStaff] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    staff: null,
    isLoading: false,
  });
  const [suspendConfirm, setSuspendConfirm] = useState({
    isOpen: false,
    staff: null,
    isLoading: false,
  });

  const location = useLocation();
  const navigate = useNavigate();

  const handleConfirmSuspendStaff = async () => {
    if (!suspendConfirm.staff) return;
    const { _id: id, status, firstName, lastName, name } = suspendConfirm.staff;
    const staffName = `${firstName || ""} ${lastName || ""}`.trim() || name || "Staff member";
    const isSuspending = status === "active";

    try {
      setSuspendConfirm((prev) => ({ ...prev, isLoading: true }));
      if (isSuspending) {
        await suspendStaff(id).unwrap();
        toast.success(`${staffName}'s account has been suspended`);
      } else {
        await reactivateStaff(id).unwrap();
        toast.success(`${staffName}'s account has been reactivated`);
      }
      setSuspendConfirm({ isOpen: false, staff: null, isLoading: false });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || `Failed to ${isSuspending ? "suspend" : "reactivate"} staff`);
      setSuspendConfirm((prev) => ({ ...prev, isLoading: false }));
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

  const handleConfirmDeleteStaff = async () => {
    if (!deleteConfirm.staff) return;
    try {
      setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
      await deleteStaff(deleteConfirm.staff._id).unwrap();
      toast.success("Staff deleted successfully");
      setDeleteConfirm({ isOpen: false, staff: null, isLoading: false });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete staff");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => (page - 1) * 50 + params.node.rowIndex + 1,
        width: 54,
        minWidth: 50,
        maxWidth: 60,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center font-medium text-slate-400 font-inter text-[13.5px]",
        headerClass: "text-center",
      },
      {
        headerName: "Staff Member",
        minWidth: 240,
        flex: 1.5,
        pinned: "left",
        cellRenderer: (params) => {
          const item = params.data;
          if (!item) return null;
          const name = `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.name || "User";
          const avatarColor = getAvatarColor(name);
          return (
            <div className="flex items-center gap-3 py-1 font-inter">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs uppercase border border-slate-200 dark:border-slate-700 flex-shrink-0 ${avatarColor}`}
              >
                {name.charAt(0)}
              </div>
              <div className="truncate">
                <button
                  type="button"
                  onClick={() => navigate(`/staff/${item._id}/edit`)}
                  className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition text-left truncate block text-[14px] hover:underline"
                >
                  {name}
                </button>
                <span className="text-xs text-slate-400 block truncate font-medium">
                  {item.role || "Staff"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Email",
        field: "email",
        minWidth: 200,
        flex: 1.2,
        cellRenderer: (params) => (
          <span className="font-inter text-slate-600 dark:text-slate-300 truncate text-[14px]">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Role",
        field: "role",
        minWidth: 140,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter font-semibold text-slate-800 dark:text-slate-200 capitalize text-[14px]">
            {params.value || "Staff"}
          </span>
        ),
      },
      {
        headerName: "Permissions",
        field: "permissionMode",
        minWidth: 140,
        flex: 1,
        cellRenderer: (params) => {
          const isCustom = params.value === "CUSTOM";
          return (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize font-inter ${
                isCustom
                  ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                  : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {isCustom ? "Custom" : "Inherited"}
            </span>
          );
        },
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 130,
        flex: 0.9,
        cellRenderer: (params) => {
          return renderStatusPill(params.value || "active");
        },
      },
      {
        headerName: "Actions",
        pinned: "right",
        width: 76,
        minWidth: 76,
        maxWidth: 80,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center overflow-visible",
        cellRenderer: (params) => {
          const item = params.data;
          if (!item) return null;

          const actions = [
            {
              label: "Quick View",
              icon: "heroicons-outline:eye",
              onClick: () => setQuickViewStaff(item),
            },
            {
              label: "View Activity",
              icon: "heroicons-outline:clock",
              onClick: () => {
                setSelectedStaff(item);
                setShowActivity(true);
              },
            },
            {
              label: "Edit Staff",
              icon: "heroicons-outline:pencil-square",
              onClick: () => navigate(`/staff/${item._id}/edit`, { state: { staff: item } }),
            },
            {
              label: "Reset Password",
              icon: "heroicons-outline:key",
              onClick: () => handleResetPassword(item._id),
            },
            {
              label: item.status === "active" ? "Suspend Account" : "Reactivate Account",
              icon: item.status === "active" ? "heroicons:no-symbol" : "heroicons:check-circle",
              onClick: () => {
                setSuspendConfirm({
                  isOpen: true,
                  staff: item,
                  isLoading: false,
                });
              },
              disabled: item.status === "disabled",
            },
            { divider: true },
            {
              label: "Delete Staff",
              icon: "heroicons-outline:trash",
              variant: "danger",
              disabled: item.status === "disabled",
              onClick: () => {
                setDeleteConfirm({
                  isOpen: true,
                  staff: item,
                  isLoading: false,
                });
              },
            },
          ];

          return <RowActions actions={actions} label="Staff actions" align="right" />;
        },
      },
    ],
    [navigate]
  );

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

      {/* Staff AG Grid Table */}
      <DataGrid
        rowData={staffList}
        columnDefs={columnDefs}
        enableSelection={true}
        entityName="staff members"
        pagination={totalPages > 1 || staffList.length > 10}
        paginationData={{
          page,
          limit: 50,
          total: totalPages * 50,
          totalPages,
        }}
        onPageChange={(newPage) => updateParams({ page: newPage })}
        isLoading={isLoading}
        emptyMessage="No staff members matching your criteria"
      />

      {/* Staff Activity Modal */}
      <Modal
        activeModal={showActivity}
        onClose={() => setShowActivity(false)}
        title={`Activity: ${selectedStaff?.firstName || ""}`}
        centered={true}
      >
        {selectedStaff && <StaffActivity staffId={selectedStaff._id} />}
      </Modal>

      {/* Reusable Quick View Drawer for Staff */}
      <QuickViewDrawer
        isOpen={Boolean(quickViewStaff)}
        onClose={() => setQuickViewStaff(null)}
        title={`${quickViewStaff?.firstName || ""} ${quickViewStaff?.lastName || ""}`.trim() || quickViewStaff?.name}
        subtitle={`Staff ID: ${quickViewStaff?._id?.slice(-6) || "—"}`}
        badge={
          quickViewStaff?.status && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
              {quickViewStaff.status}
            </span>
          )
        }
        onViewDetails={() => {
          setSelectedStaff(quickViewStaff);
          setShowActivity(true);
        }}
        onEdit={() =>
          navigate(`/staff/${quickViewStaff?._id}/edit`, {
            state: { staff: quickViewStaff },
          })
        }
        groups={[
          {
            title: "Staff Details",
            items: [
              { label: "Email", value: quickViewStaff?.email },
              { label: "Phone", value: quickViewStaff?.phone || "Not specified" },
              { label: "Role", value: quickViewStaff?.role },
              {
                label: "Permissions Mode",
                value:
                  quickViewStaff?.permissionMode === "CUSTOM"
                    ? "Custom Override"
                    : "Inherited from Role",
              },
            ],
          },
          {
            title: "Activity & System Information",
            items: [
              {
                label: "Status",
                value: quickViewStaff?.status || "Active",
              },
              {
                label: "Department",
                value: quickViewStaff?.department || "General Administration",
              },
              {
                label: "Joined Date",
                value: quickViewStaff?.createdAt
                  ? dayjs(quickViewStaff.createdAt).format("MMM D, YYYY")
                  : "—",
              },
            ],
          },
        ]}
      />

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, staff: null, isLoading: false })
        }
        onConfirm={handleConfirmDeleteStaff}
        title="Delete Staff Member"
        entityName={
          deleteConfirm.staff
            ? `${deleteConfirm.staff.firstName || ""} ${deleteConfirm.staff.lastName || ""}`.trim() ||
              deleteConfirm.staff.name
            : "this staff member"
        }
        isLoading={deleteConfirm.isLoading}
        confirmText="Delete Staff"
      />

      {/* Generic Confirmation Modal (for password reset, etc.) */}
      <Modal
        activeModal={confirmAction.show}
        onClose={() => setConfirmAction({ show: false, action: null, message: "", title: "" })}
        title={confirmAction.title}
        centered={true}
        className="max-w-[460px] font-inter"
      >
        <div className="pt-1">
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">{confirmAction.message}</p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition"
              onClick={() => setConfirmAction({ show: false, action: null, message: "", title: "" })}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition"
              onClick={confirmAction.action}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Suspend / Reactivate Confirmation Modal */}
      <Modal
        title={suspendConfirm.staff?.status === "active" ? "Suspend Staff Account" : "Reactivate Staff Account"}
        activeModal={suspendConfirm.isOpen}
        onClose={suspendConfirm.isLoading ? () => {} : () => setSuspendConfirm({ isOpen: false, staff: null, isLoading: false })}
        className="max-w-[540px] font-inter"
        centered={true}
      >
        {suspendConfirm.staff && (
          <div className="pt-2 pb-1 font-inter">
            {/* Centered Circular Badge */}
            <div
              className={`h-16 w-16 rounded-full border flex items-center justify-center mx-auto mb-4 ${
                suspendConfirm.staff.status === "active"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40"
              }`}
            >
              <Icon
                icon={suspendConfirm.staff.status === "active" ? "heroicons-outline:no-symbol" : "heroicons-outline:check-circle"}
                className={`text-3xl ${
                  suspendConfirm.staff.status === "active" ? "text-amber-500" : "text-emerald-500"
                }`}
              />
            </div>

            {/* Question */}
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white text-center mb-2 px-2">
              {suspendConfirm.staff.status === "active"
                ? `Are you sure you want to suspend this staff account?`
                : `Are you sure you want to reactivate this staff account?`}
            </h3>

            {/* Explanation */}
            <p className="text-xs md:text-[13px] text-slate-500 dark:text-slate-400 text-center max-w-md mx-auto mb-5 leading-relaxed">
              {suspendConfirm.staff.status === "active" ? (
                <>
                  <strong className="font-semibold text-slate-700 dark:text-slate-200">
                    {`${suspendConfirm.staff.firstName || ""} ${suspendConfirm.staff.lastName || ""}`.trim() || suspendConfirm.staff.name}
                  </strong>{" "}
                  will be temporarily suspended and unable to log in to ThinkCRM. Existing records and activities will remain safe.
                </>
              ) : (
                <>
                  <strong className="font-semibold text-slate-700 dark:text-slate-200">
                    {`${suspendConfirm.staff.firstName || ""} ${suspendConfirm.staff.lastName || ""}`.trim() || suspendConfirm.staff.name}
                  </strong>{" "}
                  will regain immediate access to ThinkCRM and resume their assigned role and permissions.
                </>
              )}
            </p>

            {/* Warning Alert Banner Box */}
            <div
              className={`border rounded-xl p-3.5 flex items-center gap-3 text-left mb-6 ${
                suspendConfirm.staff.status === "active"
                  ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60"
                  : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                  suspendConfirm.staff.status === "active"
                    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <Icon
                  icon={suspendConfirm.staff.status === "active" ? "heroicons-outline:exclamation-triangle" : "heroicons-outline:information-circle"}
                  className="text-lg"
                />
              </div>
              <div>
                <p
                  className={`text-xs font-bold ${
                    suspendConfirm.staff.status === "active" ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {suspendConfirm.staff.status === "active"
                    ? "Temporary Account Suspension"
                    : "Immediate Account Reactivation"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    suspendConfirm.staff.status === "active"
                      ? "text-amber-600/90 dark:text-amber-400/80"
                      : "text-emerald-600/90 dark:text-emerald-400/80"
                  }`}
                >
                  {suspendConfirm.staff.status === "active"
                    ? "This user can be reactivated at any time by an administrator."
                    : "The user will be able to log in immediately with their existing password."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition disabled:opacity-50"
                onClick={() => setSuspendConfirm({ isOpen: false, staff: null, isLoading: false })}
                disabled={suspendConfirm.isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs md:text-sm font-semibold transition disabled:opacity-60 ${
                  suspendConfirm.staff.status === "active"
                    ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                }`}
                onClick={handleConfirmSuspendStaff}
                disabled={suspendConfirm.isLoading}
              >
                {suspendConfirm.isLoading && (
                  <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />
                )}
                <span>
                  {suspendConfirm.isLoading
                    ? (suspendConfirm.staff.status === "active" ? "Suspending Account..." : "Reactivating Account...")
                    : (suspendConfirm.staff.status === "active" ? "Suspend Account" : "Reactivate Account")}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Staff;
