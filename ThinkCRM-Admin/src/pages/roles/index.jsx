import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const Roles = () => {
  const roles = {
    Owner: ["leads.view", "leads.create", "leads.update", "leads.delete", "leads.assign", "customers.view", "customers.create", "customers.update", "customers.delete", "staff.view", "staff.create", "staff.update", "staff.delete", "reports.view", "settings.view", "settings.update"],
    Admin: ["leads.view", "leads.create", "leads.update", "leads.assign", "customers.view", "customers.create", "customers.update", "staff.view", "staff.create", "staff.update", "reports.view", "settings.view", "settings.update"],
    "Sales Manager": ["leads.view", "leads.create", "leads.update", "leads.assign", "customers.view", "customers.create", "customers.update", "reports.view"],
    "Sales Executive": ["leads.view", "leads.create", "leads.update", "customers.view", "customers.create"],
    Staff: ["leads.view", "customers.view"]
  };

  const roleDescriptions = {
    Owner: "Full system authority. Has unrestricted access to all modules, staff management, and system settings.",
    Admin: "Operational administrator. Manages leads, customers, staff members, and settings.",
    "Sales Manager": "Manages sales teams, assigns leads, views performance reports, and manages customers.",
    "Sales Executive": "Handles individual sales pipeline. Can create, view, and update assigned leads and customers.",
    Staff: "Basic access. Can view assigned leads and customers."
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white">System Roles & Permissions</h4>
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
