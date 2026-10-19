import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import PhoneInputWithCountry from "@/components/ui/PhoneInputWithCountry";
import { validateEmail, validatePhone, focusFirstError } from "@/utils/validation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useGetSystemSettingsQuery, useUpdateSystemSettingsMutation } from "@/store/api/management/managementApiSlice";
import Loading from "@/components/Loading";

const Settings = () => {
  const { data: settingsResponse, isLoading, error } = useGetSystemSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSystemSettingsMutation();
  const [companyPhone, setCompanyPhone] = useState("");
  const [customErrors, setCustomErrors] = useState({});

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (settingsResponse?.data?.settings) {
      reset(settingsResponse.data.settings);
      setCompanyPhone(settingsResponse.data.settings.companyPhone || "");
    }
  }, [settingsResponse, reset]);

  const onSubmit = async (data) => {
    const newErrors = {};

    if (data.companyEmail) {
      const emailCheck = validateEmail(data.companyEmail, false);
      if (!emailCheck.isValid) newErrors.companyEmail = emailCheck.error;
    }

    if (companyPhone) {
      const phoneCheck = validatePhone(companyPhone, false);
      if (!phoneCheck.isValid) newErrors.companyPhone = phoneCheck.error;
    }

    if (data?.emailSettings?.senderEmail) {
      const senderCheck = validateEmail(data.emailSettings.senderEmail, false);
      if (!senderCheck.isValid) newErrors.senderEmail = senderCheck.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setCustomErrors(newErrors);
      focusFirstError(newErrors);
      return;
    }
    setCustomErrors({});

    try {
      await updateSettings({
        ...data,
        companyPhone: companyPhone ? companyPhone.trim() : null,
      }).unwrap();
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
            <div>
              <Textinput
                name="companyEmail"
                label="Company Email"
                type="email"
                register={register}
                placeholder="contact@example.com"
                error={customErrors.companyEmail ? { message: customErrors.companyEmail } : errors.companyEmail}
              />
            </div>
            <div>
              <PhoneInputWithCountry
                label="Company Phone"
                value={companyPhone}
                onChange={(val) => {
                  setCompanyPhone(val);
                  if (customErrors.companyPhone) {
                    setCustomErrors((prev) => ({ ...prev, companyPhone: null }));
                  }
                }}
                error={customErrors.companyPhone}
                required={false}
              />
            </div>
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
            <div>
              <Textinput
                name="emailSettings.senderEmail"
                label="Default Reply-To Email"
                type="email"
                register={register}
                placeholder="no-reply@example.com"
                error={customErrors.senderEmail ? { message: customErrors.senderEmail } : null}
              />
            </div>
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
