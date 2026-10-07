import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/Loading";
import { useGetPermissionsRegistryQuery } from "@/store/api/management/managementApiSlice";

const Roles = () => {
  const { data: response, isLoading, error } = useGetPermissionsRegistryQuery();

  if (isLoading) return <Loading />;
  if (error) return <div className="text-danger-500 p-4">Failed to load system roles registry.</div>;

  const roles = response?.data?.roles || {};

  const roleDescriptions = {
    SUPER_ADMIN: "Full system authority. Has unrestricted access to all administrative modules, security controls, and financial operations.",
    ADMIN: "Operational administrator. Manages products, inventory, orders, customer accounts, coupons, and reports.",
    PHARMACIST: "Clinical fulfillment specialist. Manages prescription verification queues, medicine batch allocations, and expiry auditing.",
    DELIVERY: "Logistics coordinator. Views active dispatched orders and manages delivery status updates."
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white">System Roles & RBAC Matrix</h4>
          <p className="text-xs text-slate-500 mt-1">Live role definition registry mapped to granular operational capabilities.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(roles).map(([roleName, permissions]) => (
          <Card key={roleName} title={roleName} headerslot={<Badge label={`${permissions.length} Permissions`} className="bg-primary-500 text-white" />}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {roleDescriptions[roleName] || "Configured system role with defined operational boundaries."}
              </p>

              <div>
                <h6 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Granted Permissions ({permissions.length})</h6>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                  {permissions.map((perm) => (
                    <span key={perm} className="text-xs font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Roles;
