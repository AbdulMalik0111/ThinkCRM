import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import { useGetPermissionsRegistryQuery } from "@/store/api/management/managementApiSlice";

const Permissions = () => {
  const { data: response, isLoading } = useGetPermissionsRegistryQuery();
  const permissionsGrouped = response?.data?.permissions || {};
  const modules = Object.entries(permissionsGrouped);
  const totalPermissions = modules.reduce((acc, [, perms]) => acc + perms.length, 0);

  if (isLoading) return <Loading />;

  const moduleIcons = {
    Catalog: "heroicons:shopping-cart",
    Inventory: "heroicons:cube",
    Purchases: "heroicons:truck",
    Orders: "heroicons:shopping-bag",
    Customers: "heroicons:users",
    System: "heroicons:cog-6-tooth",
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">Permissions Master Registry</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Authoritative registry of granular capabilities across ThinkCRM core modules.
          </p>
        </div>
        <Badge
          label={`${totalPermissions} System Permissions Registered`}
          className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm px-3 py-1.5"
        />
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(([moduleName, perms]) => (
          <Card key={moduleName} bodyClass="p-5 flex flex-col justify-between" className="border-t-4 border-t-indigo-500">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Icon icon={moduleIcons[moduleName] || "heroicons:key"} className="text-indigo-600 dark:text-indigo-400 text-xl" />
                  </div>
                  <h5 className="text-base font-bold text-slate-900 dark:text-white">{moduleName}</h5>
                </div>
                <Badge label={`${perms.length} Keys`} className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300" />
              </div>

              <div className="space-y-2">
                {perms.map((perm) => (
                  <div
                    key={perm}
                    className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{perm}</span>
                    <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
                      <Icon icon="heroicons:check-circle" className="text-xs" /> Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
              Module Scope: <span className="font-semibold text-slate-600 dark:text-slate-300">{moduleName}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Permissions;
