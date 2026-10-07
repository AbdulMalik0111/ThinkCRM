import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Pagination from "@/components/ui/Pagination";
import Tooltip from "@/components/ui/Tooltip";
import { useGetCustomersQuery } from "@/store/api/customers/customersApiSlice";
import Loading from "@/components/Loading";
import dayjs from "dayjs";

const Customers = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const queryParams = {
    page: currentPage,
    limit,
    ...(search && { search }),
  };

  const { data: response, isLoading, isFetching, refetch } = useGetCustomersQuery(queryParams);

  const customers = response?.data?.customers || [];
  const totalPages = response?.data?.totalPages || 1;
  const totalCustomers = response?.data?.total || 0;

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">Customers Directory</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total {totalCustomers} customer{totalCustomers !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon="heroicons-outline:arrow-path"
            className="btn-outline-dark h-10 w-10 p-0 flex items-center justify-center"
            onClick={refetch}
            disabled={isFetching}
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex justify-between items-center">
          <div className="w-full sm:w-1/3">
            <Textinput
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              hasicon
              icon="heroicons-outline:search"
            />
          </div>
          {(search) && (
            <button onClick={() => setSearch("")} className="text-sm text-danger-500 font-medium hover:underline ml-4">
              Clear Search
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card noborder>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
                <thead className="bg-slate-200 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="table-th">Customer ID</th>
                    <th scope="col" className="table-th">Name</th>
                    <th scope="col" className="table-th">Contact</th>
                    <th scope="col" className="table-th">Location</th>
                    <th scope="col" className="table-th">Acquired On</th>
                    <th scope="col" className="table-th text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                  {customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="table-td">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                          {customer.customerId}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm text-slate-900 dark:text-white font-medium block">
                          {customer.fullName}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {customer.email && <div className="truncate max-w-[150px]" title={customer.email}>{customer.email}</div>}
                          <div>{customer.phone}</div>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="text-sm text-slate-600 dark:text-slate-300 truncate block max-w-[200px]" title={customer.location || customer.address}>
                          {customer.location || customer.address || '-'}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {dayjs(customer.createdAt).format("MMM D, YYYY")}
                        </span>
                      </td>
                      <td className="table-td text-center">
                        <div className="flex justify-center space-x-3">
                          <Tooltip content="View Profile" placement="top">
                            <button
                              className="action-btn text-primary-500"
                              onClick={() => navigate(`/customers/${customer._id}`)}
                            >
                              <Icon icon="heroicons:eye" className="text-xl" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500">
                        No customers found. (Convert leads to customers from the Lead Details page when they are 'Won')
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-slate-500">
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCustomers)} of {totalCustomers} entries
            </span>
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              handlePageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Customers;
