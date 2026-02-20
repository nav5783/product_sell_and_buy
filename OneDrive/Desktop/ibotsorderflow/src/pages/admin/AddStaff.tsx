import React from "react";
import AdminGuard from "../../components/AdminGuard";
import ManageUsers from "./ManageUsers";

export default function AddStaffPage() {
  return (
    <AdminGuard>
      <ManageUsers role="staff" title="Staff" />
    </AdminGuard>
  );
}