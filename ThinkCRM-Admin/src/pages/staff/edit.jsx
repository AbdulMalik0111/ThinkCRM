import React, { useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import StaffForm from "./components/StaffForm";
import { useUpdateStaffMutation } from "@/store/api/management/managementApiSlice";
import { updateUserProfile } from "@/store/api/auth/authSlice";
import { toast } from "react-toastify";
import Card from "@/components/ui/Card";

const StaffEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const initialStaffData = location.state?.staff;
  
  const [updateStaff, { isLoading, isSuccess, isError, error }] = useUpdateStaffMutation();

  useEffect(() => {
    if (!initialStaffData) {
      toast.error("Staff member data not found. Please select from the list.");
      navigate("/staff");
    }
  }, [initialStaffData, navigate]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Staff member updated successfully");
      navigate("/staff");
    }
    if (isError) {
      toast.error(error?.data?.message || "Failed to update staff member");
    }
  }, [isSuccess, isError, error, navigate]);

  const handleSubmit = async (formData) => {
    const payload = {
      id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      role: formData.role,
      permissions: formData.permissions,
      status: formData.status,
      isActive: formData.isActive
    };
    
    try {
      const res = await updateStaff(payload).unwrap();
      const currentId = currentUser?._id || currentUser?.id;
      if (currentId && (currentId === id || currentUser?.email === initialStaffData?.email)) {
        dispatch(updateUserProfile({
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          role: payload.role,
          permissions: payload.permissions,
          ...(res?.data?.user || {}),
        }));
      }
    } catch (err) {
      // handled by mutation error state
    }
  };

  if (!initialStaffData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4 mb-2 sm:mb-0">
            Edit Staff Member
          </h4>
          <div className="text-sm text-slate-500">
            Update profile details, role, and permissions for {initialStaffData.firstName} {initialStaffData.lastName}.
          </div>
        </div>
      </div>

      <StaffForm 
        initialData={initialStaffData}
        isEdit={true} 
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default StaffEdit;
