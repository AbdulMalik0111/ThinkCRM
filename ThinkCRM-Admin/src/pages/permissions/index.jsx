import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/Loading";
import { useGetPermissionsRegistryQuery } from "@/store/api/management/managementApiSlice";

const Permissions = () => {
  const { data: response, isLoading, error } = useGetPermissionsRegistryQuery();

  if (isLoading) return <Loading />;
  if (error) return <div className="text-danger-500 p-4">Failed to load system permissions registry.</div>;

  const permissionsByModule = response?.data?.permissions || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white">Granular System Permissions</h4>
          <p className="text-xs text-slate-500 mt-1">Direct view of all module-level access control tags enforced across the ThinkCRM platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
          <Card key={moduleName} title={`${moduleName} Module`} headerslot={<Badge label={`${perms.length} Keys`} className="bg-indigo-500 text-white" />}>
            <div className="space-y-2">
              {perms.map((perm) => (
                <div key={perm} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">{perm}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {perm.split(':')[1] || 'access'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Permissions;
