import React from "react";
import AdminGuard from "../../components/AdminGuard";
import ManageUsers from "./ManageUsers";

export default function AddAdminPage() {
  return (
    <AdminGuard>
      <ManageUsers role="admin" title="Admin" />
    </AdminGuard>
  );
}