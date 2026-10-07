import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import Radio from "@/components/ui/Radio";
import Icon from "@/components/ui/Icon";

const roleOptions = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "INVENTORY_STAFF", label: "Inventory Staff" },
  { value: "CASHIER", label: "Cashier" },
  { value: "ORDER_STAFF", label: "Order Staff" },
  { value: "SUPPORT_STAFF", label: "Support Staff" },
];

const PERMISSIONS_REGISTRY = {
  "Leads": ["leads.view", "leads.create", "leads.update", "leads.delete", "leads.assign"],
  "Customers": ["customers.view", "customers.create", "customers.update"],
  "Quotations": ["quotations.view", "quotations.create", "quotations.send"],
  "Measurements": ["measurements.view", "measurements.create", "measurements.update"],
  "Staff": ["staff.view", "staff.create", "staff.update", "staff.delete"],
  "Notifications": ["notifications.view"],
  "Reports": ["reports.view"],
  "Settings": ["settings.view", "settings.update"],
};

const StaffForm = ({ 
  initialData = null, 
  isEdit = false, 
  onSubmit, 
  isLoading 
}) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "INVENTORY_STAFF",
    permissionMode: "INHERIT_ROLE",
    assignedPermissions: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        password: "", // Not edited here
        role: initialData.role || "INVENTORY_STAFF",
        permissionMode: initialData.permissionMode || "INHERIT_ROLE",
        assignedPermissions: initialData.assignedPermissions || []
      });
    }
  }, [initialData]);

  const permissionsRegistry = PERMISSIONS_REGISTRY;
  const allAvailablePermissions = Object.values(permissionsRegistry).flat();
  const totalPermissionsCount = allAvailablePermissions.length;
  const selectedPermissionsCount = formData.assignedPermissions.length;

  const handlePermissionChange = (permId) => {
    setFormData(prev => {
      const current = prev.assignedPermissions;
      if (current.includes(permId)) {
        return { ...prev, assignedPermissions: current.filter(p => p !== permId) };
      } else {
        return { ...prev, assignedPermissions: [...current, permId] };
      }
    });
  };

  const handleSelectAllModule = (modulePermissions) => {
    setFormData(prev => {
      const current = new Set(prev.assignedPermissions);
      modulePermissions.forEach(p => current.add(p));
      return { ...prev, assignedPermissions: Array.from(current) };
    });
  };

  const handleClearAllModule = (modulePermissions) => {
    setFormData(prev => {
      const current = new Set(prev.assignedPermissions);
      modulePermissions.forEach(p => current.delete(p));
      return { ...prev, assignedPermissions: Array.from(current) };
    });
  };

  const handleGlobalSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      assignedPermissions: [...allAvailablePermissions]
    }));
  };

  const handleGlobalClearAll = () => {
    setFormData(prev => ({
      ...prev,
      assignedPermissions: []
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textinput 
            label="First Name *" 
            placeholder="e.g. John" 
            type="text" 
            value={formData.firstName} 
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
            required 
          />
          <Textinput 
            label="Last Name *" 
            placeholder="e.g. Doe" 
            type="text" 
            value={formData.lastName} 
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
            required 
          />
          <Textinput 
            label="Email *" 
            placeholder="e.g. john@thinkcrm.com" 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            disabled={isEdit} 
            required 
          />
          {!isEdit && (
            <Textinput 
              label="Password *" 
              placeholder="Enter secure password" 
              type="password" 
              hasicon 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              required 
            />
          )}
        </div>
      </Card>

      <Card title="Access">
        <div className="space-y-6">
          <div className="w-full md:w-1/2">
            <Select 
              label="Role *" 
              options={roleOptions} 
              value={formData.role} 
              onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
              required 
            />
          </div>

          <div>
            <label className="form-label block mb-3">Permission Mode *</label>
            <div className="flex flex-col space-y-4">
              <div className="flex items-start space-x-3">
                <Radio
                  name="permissionMode"
                  value="INHERIT_ROLE"
                  checked={formData.permissionMode === 'INHERIT_ROLE'}
                  onChange={(e) => setFormData({ ...formData, permissionMode: e.target.value })}
                />
                <div className="-mt-1">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">Inherit Role Permissions</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                    Staff receives all permissions assigned to the selected role above.
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Radio
                  name="permissionMode"
                  value="CUSTOM"
                  checked={formData.permissionMode === 'CUSTOM'}
                  onChange={(e) => setFormData({ ...formData, permissionMode: e.target.value })}
                />
                <div className="-mt-1">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">Custom Permissions</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                    Staff receives ONLY the permissions explicitly selected below, overriding the default role permissions.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {formData.permissionMode === 'CUSTOM' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="card-title">Permissions</h4>
              <p className="text-sm text-slate-500 mt-1">
                {selectedPermissionsCount} / {totalPermissionsCount} selected
              </p>
            </div>
            <div className="flex space-x-2">
              <button 
                type="button" 
                onClick={handleGlobalSelectAll}
                className="text-xs font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded bg-primary-50 dark:bg-primary-900/30"
              >
                Select All
              </button>
              <button 
                type="button" 
                onClick={handleGlobalClearAll}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(permissionsRegistry).map((moduleName) => {
              const modulePerms = permissionsRegistry[moduleName];
              const selectedInModule = modulePerms.filter(p => formData.assignedPermissions.includes(p)).length;
              const totalInModule = modulePerms.length;

              return (
                <div key={moduleName} className="border border-slate-200 dark:border-slate-700 rounded-md p-4 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <h6 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{moduleName}</h6>
                      <span className="text-xs text-slate-400">{selectedInModule} / {totalInModule}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <button 
                        type="button"
                        onClick={() => handleSelectAllModule(modulePerms)}
                        className="text-[10px] uppercase font-bold text-primary-500 text-right hover:underline"
                      >
                        Select All
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleClearAllModule(modulePerms)}
                        className="text-[10px] uppercase font-bold text-slate-400 text-right hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {modulePerms.map((perm) => {
                      // format permission name for better UI (e.g. "orders:manage" -> "Manage")
                      const permLabelParts = perm.split(':');
                      const label = permLabelParts.length > 1 
                        ? permLabelParts[1].charAt(0).toUpperCase() + permLabelParts[1].slice(1).replace(/_/g, ' ') 
                        : perm;

                      return (
                        <Checkbox
                          key={perm}
                          label={label}
                          value={formData.assignedPermissions.includes(perm)}
                          onChange={() => handlePermissionChange(perm)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isEdit && (
        <div className="bg-warning-50 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 p-4 rounded-md flex items-start space-x-3">
          <Icon icon="heroicons:exclamation-triangle" className="text-xl shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Important Note</p>
            <p>Changing Role or Permissions will immediately revoke the staff member's active sessions. They will need to log in again.</p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button 
          type="button" 
          text="Cancel" 
          className="btn-light" 
          onClick={() => navigate("/staff")} 
        />
        <Button 
          type="submit" 
          text={isEdit ? "Save Changes" : "Create Staff"} 
          className="btn-dark" 
          isLoading={isLoading} 
        />
      </div>
    </form>
  );
};

export default StaffForm;
