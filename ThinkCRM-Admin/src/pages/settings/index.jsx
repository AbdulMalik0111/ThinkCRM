import React, { useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
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
    <div className="space-y-5">
      <Card title="System Settings">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textinput
              name="STORE_NAME"
              label="Store Name"
              type="text"
              register={register}
              placeholder="ThinkCRM"
              error={errors.STORE_NAME}
            />
            <Textinput
              name="SUPPORT_EMAIL"
              label="Support Email"
              type="email"
              register={register}
              placeholder="support@thinkcrm.com"
              error={errors.SUPPORT_EMAIL}
            />
            <Textinput
              name="CONTACT_NUMBER"
              label="Contact Number"
              type="text"
              register={register}
              placeholder="1800-000-0000"
              error={errors.CONTACT_NUMBER}
            />
            <Textinput
              name="MIN_ORDER_VALUE"
              label="Minimum Order Value (₹)"
              type="number"
              register={register}
              placeholder="100"
              error={errors.MIN_ORDER_VALUE}
            />
            <Textinput
              name="FREE_SHIPPING_THRESHOLD"
              label="Free Shipping Threshold (₹)"
              type="number"
              register={register}
              placeholder="500"
              error={errors.FREE_SHIPPING_THRESHOLD}
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <Textinput
              name="STORE_ADDRESS"
              label="Store Address"
              type="text"
              register={register}
              placeholder="123 Pharma St, Medical District"
              error={errors.STORE_ADDRESS}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              text="Save Settings"
              className="btn-primary"
              isLoading={isUpdating}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Settings;
