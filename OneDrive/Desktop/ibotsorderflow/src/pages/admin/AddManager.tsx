import React from "react";
import AdminGuard from "../../components/AdminGuard";
import ManageUsers from "./ManageUsers";

export default function AddManagerPage() {
  return (
    <AdminGuard>
      <ManageUsers role="manager" title="Manager" />
    </AdminGuard>
  );
}