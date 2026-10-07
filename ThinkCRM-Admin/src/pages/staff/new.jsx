import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StaffForm from "./components/StaffForm";
import { useCreateStaffMutation } from "@/store/api/management/managementApiSlice";
import { toast } from "react-toastify";

const StaffNew = () => {
  const navigate = useNavigate();
  const [createStaff, { isLoading, isSuccess, isError, error }] = useCreateStaffMutation();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Staff member created successfully");
      navigate("/staff");
    }
    if (isError) {
      toast.error(error?.data?.message || "Failed to create staff member");
    }
  }, [isSuccess, isError, error, navigate]);

  const handleSubmit = (formData) => {
    createStaff(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4 mb-2 sm:mb-0">
            Add New Staff Member
          </h4>
          <div className="text-sm text-slate-500">
            Create a new staff account and assign appropriate permissions.
          </div>
        </div>
      </div>

      <StaffForm 
        isEdit={false} 
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default StaffNew;
