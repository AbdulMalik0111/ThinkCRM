import React, { useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useGetSystemSettingsQuery, useUpdateSystemSettingsMutation } from "@/store/api/management/managementApiSlice";
import Loading from "@/components/Loading";

const Settings = () => {
  const { data: settingsResponse, isLoading, error } = useGetSystemSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSystemSettingsMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (settingsResponse?.data?.settings) {
      reset(settingsResponse.data.settings);
    }
  }, [settingsResponse, reset]);

  const onSubmit = async (data) => {
    try {
      await updateSettings(data).unwrap();
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update settings");
    }
  };

  if (isLoading) return <Loading />;
  
  if (error) {
    return (
      <div className="p-4 rounded bg-red-50 text-red-600 border border-red-200">
        Error loading settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4 mb-2 sm:mb-0">
            System Settings
          </h4>
          <div className="text-sm text-slate-500">
            Manage your company information, emails, and system preferences.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Company Settings */}
        <Card title="Company Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textinput
              name="companyName"
              label="Company Name"
              type="text"
              register={register}
              placeholder="ThinkCRM"
              error={errors.companyName}
            />
            <Textinput
              name="companyEmail"
              label="Company Email"
              type="email"
              register={register}
              placeholder="contact@example.com"
              error={errors.companyEmail}
            />
            <Textinput
              name="companyPhone"
              label="Company Phone"
              type="text"
              register={register}
              placeholder="+1234567890"
              error={errors.companyPhone}
            />
            <div className="md:col-span-2">
              <Textarea
                name="companyAddress"
                label="Company Address"
                register={register}
                placeholder="123 Business Park, City, Country"
                error={errors.companyAddress}
              />
            </div>
          </div>
        </Card>

        {/* Email Settings */}
        <Card title="Email Configuration">
          <div className="text-sm text-slate-500 mb-4">
            Email configuration (SMTP) is managed via environment variables for security. Contact your administrator to change SMTP credentials.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textinput
              name="emailSettings.senderName"
              label="Default Sender Name"
              type="text"
              register={register}
              placeholder="ThinkCRM System"
            />
            <Textinput
              name="emailSettings.senderEmail"
              label="Default Reply-To Email"
              type="email"
              register={register}
              placeholder="no-reply@example.com"
            />
          </div>
        </Card>

        {/* Action Bar */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            text="Save All Settings"
            className="btn-primary"
            isLoading={isUpdating}
          />
        </div>
      </form>
    </div>
  );
};

export default Settings;
