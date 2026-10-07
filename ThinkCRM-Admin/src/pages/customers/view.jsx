import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import { useGetCustomerByIdQuery } from "@/store/api/customers/customersApiSlice";
import dayjs from "dayjs";

const CustomerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetCustomerByIdQuery(id);

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading customer details.</div>;

  const customer = data?.data?.customer;
  if (!customer) return <div>Customer not found.</div>;

  const originalLead = customer.sourceLeadId;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/customers")} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <Icon icon="heroicons:arrow-left" className="text-xl" />
          </button>
          <div>
            <h4 className="font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-3">
              {customer.fullName}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Customer ID: {customer.customerId} | Acquired on {dayjs(customer.createdAt).format("MMM D, YYYY")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-5">
          <Card title="Contact Information">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Icon icon="heroicons:phone" className="text-xl text-slate-400" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Icon icon="heroicons:envelope" className="text-xl text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Icon icon="heroicons:map-pin" className="text-xl text-slate-400 mt-0.5" />
                <span>{customer.address ? `${customer.address}, ` : ''}{customer.location || 'Location not provided'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Project History */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Original Project Details (Converted Lead)">
            {originalLead ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm text-slate-500">Project Type</span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1 capitalize">{originalLead.projectType}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-slate-500">Lead Source</span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1 capitalize">{originalLead.leadSource}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-slate-500">Budget</span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1">
                      {originalLead.budget ? `₹${originalLead.budget.toLocaleString()}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm text-slate-500">Converted On</span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1">
                      {dayjs(customer.createdAt).format("MMM D, YYYY")}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="block text-sm text-slate-500">Project Description</span>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                      {originalLead.projectDescription || '-'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <Button 
                    text="View Original Lead" 
                    className="btn-outline-primary btn-sm"
                    onClick={() => navigate(`/leads/${originalLead._id}`)}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-slate-500">Original project details not available.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerView;
