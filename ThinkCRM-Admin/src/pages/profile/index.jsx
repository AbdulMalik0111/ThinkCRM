import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useSelector } from "react-redux";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate save
    setIsEditing(false);
  };

  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : "A";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-xl font-bold text-slate-900 dark:text-white">My Profile</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 font-bold text-4xl mb-4 shadow-sm">
                {initial}
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.role || "Admin"}</p>
              
              <div className="mt-6 w-full space-y-4">
                <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                  <Icon icon="heroicons-outline:mail" className="w-5 h-5 text-slate-400" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                  <Icon icon="heroicons-outline:calendar" className="w-5 h-5 text-slate-400" />
                  <span>Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
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
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 disabled:opacity-70"
                  />
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
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 disabled:opacity-70"
                />
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
