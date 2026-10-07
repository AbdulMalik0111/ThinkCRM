import React from "react";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { useChangePasswordMutation } from "@/store/api/auth/authApiSlice";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    oldPassword: yup.string().required("Old password is required"),
    newPassword: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("New password is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required"),
  })
  .required();

const ChangePassword = () => {
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      }).unwrap();
      toast.success("Password changed successfully!");
      reset();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
          Change Password
        </h4>
      </div>
      <Card title="Security Settings">
        <div className="max-w-md mx-auto mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Textinput
              label="Old Password"
              type="password"
              name="oldPassword"
              placeholder="Enter current password"
              register={register}
              error={errors.oldPassword}
              hasicon
            />
            <Textinput
              label="New Password"
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              register={register}
              error={errors.newPassword}
              hasicon
            />
            <Textinput
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              register={register}
              error={errors.confirmPassword}
              hasicon
            />
            <div className="pt-4 flex justify-end">
              <Button
                text="Update Password"
                type="submit"
                className="btn-dark"
                isLoading={isLoading}
              />
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ChangePassword;
