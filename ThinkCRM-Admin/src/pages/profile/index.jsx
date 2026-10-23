import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useSelector, useDispatch } from "react-redux";
import { validateText, validateEmail, focusFirstError } from "@/utils/validation";
import { useUpdateStaffMutation } from "@/store/api/management/managementApiSlice";
import { useGetDashboardMetricsQuery } from "@/store/api/analytics/analyticsApiSlice";
import { updateUserProfile } from "@/store/api/auth/authSlice";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [updateStaff, { isLoading }] = useUpdateStaffMutation();
  const { data: metricsResponse, isLoading: isMetricsLoading } = useGetDashboardMetricsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const m = metricsResponse?.data || {};

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const fnCheck = validateText(formData.firstName, { fieldName: "First Name", required: true, minLength: 2, maxLength: 50 });
    if (!fnCheck.isValid) errors.firstName = fnCheck.error;

    const lnCheck = validateText(formData.lastName, { fieldName: "Last Name", required: true, minLength: 1, maxLength: 50 });
    if (!lnCheck.isValid) errors.lastName = lnCheck.error;

    const emailCheck = validateEmail(formData.email, true);
    if (!emailCheck.isValid) errors.email = emailCheck.error;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      focusFirstError(errors);
      return;
    }
    setFormErrors({});

    try {
      const userId = user?._id || user?.id;
      if (userId) {
        const res = await updateStaff({
          id: userId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        }).unwrap();
        dispatch(updateUserProfile({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          ...(res?.data?.user || {}),
        }));
        toast.success("Profile updated successfully");
      }
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : "A";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white">Profile Dashboard</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time profile performance, assigned workload, and personal details.
          </p>
        </div>
      </div>

      {/* Dynamic Profile KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 rounded-lg p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Leads</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isMetricsLoading ? "..." : (m.totalLeads ?? 0)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 rounded-lg p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase">Won Deals</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isMetricsLoading ? "..." : (m.wonLeads ?? 0)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500 rounded-lg p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase">Today's Follow-ups</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isMetricsLoading ? "..." : (m.todaysFollowUps ?? 0)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-purple-500 rounded-lg p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase">Conversion Rate</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isMetricsLoading ? "..." : `${m.conversionRate || 0}%`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 font-bold text-4xl mb-4 border border-slate-300 dark:border-slate-600">
                {initial}
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h4>
              <div className="mt-1 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {user?.role || "Staff"}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Active
                </span>
              </div>
              
              <div className="mt-6 w-full space-y-4">
                <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                  <Icon icon="heroicons-outline:mail" className="w-5 h-5 text-slate-400" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                  <Icon icon="heroicons-outline:calendar" className="w-5 h-5 text-slate-400" />
                  <span>Joined {user?.createdAt ? dayjs(user.createdAt).format("MMM D, YYYY") : "Recently"}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-1 md:col-span-2">
          <Card title="Personal Information">
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full border rounded-md px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 disabled:opacity-70 ${
                      formErrors.firstName ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full border rounded-md px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 disabled:opacity-70 ${
                      formErrors.lastName ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full border rounded-md px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 disabled:opacity-70 ${
                    formErrors.email ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
