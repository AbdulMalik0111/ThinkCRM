import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import { useGetPermissionsRegistryQuery } from "@/store/api/management/managementApiSlice";

const Roles = () => {
  const roles = {
    Owner: ["leads.view", "leads.create", "leads.update", "leads.delete", "leads.assign", "customers.view", "customers.create", "customers.update", "customers.delete", "staff.view", "staff.create", "staff.update", "staff.delete", "reports.view", "settings.view", "settings.update"],
    Admin: ["leads.view", "leads.create", "leads.update", "leads.assign", "customers.view", "customers.create", "customers.update", "staff.view", "staff.create", "staff.update", "reports.view", "settings.view", "settings.update"],
    "Sales Manager": ["leads.view", "leads.create", "leads.update", "leads.assign", "customers.view", "customers.create", "customers.update", "reports.view"],
    "Sales Executive": ["leads.view", "leads.create", "leads.update", "customers.view", "customers.create"],
    Staff: ["leads.view", "customers.view"]
  };
  const roleEntries = Object.entries(roles);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">System Roles Directory</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Read-only registry of predefined system roles and their authoritative default permission sets.
          </p>
        </div>
        <Badge
          label={`${roleEntries.length} Built-in Roles`}
          className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm px-3 py-1.5"
        />
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roleEntries.map(([roleName, permissions]) => (
          <Card key={roleName} bodyClass="p-5 flex flex-col justify-between" className="border-t-4 border-t-primary-500">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon icon="heroicons:shield-check" className="text-primary-600 dark:text-primary-400 text-xl" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-slate-900 dark:text-white font-mono">{roleName}</h5>
                    <span className="text-xs text-slate-400">System Role</span>
                  </div>
                </div>
                <Badge
                  label={`${permissions.length} Permissions`}
                  className="bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                />
              </div>

              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Default Assigned Permissions
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                  {permissions.map((perm) => (
                    <span
                      key={perm}
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-sm"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
              <span>Read-Only Configuration</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">Auth Tier: Standard</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Roles;
