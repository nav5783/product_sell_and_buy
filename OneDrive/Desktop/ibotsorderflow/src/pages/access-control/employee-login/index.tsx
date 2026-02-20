import React, { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import DataTable from "../../../components/Table/DataTable";
import type { EmployeeLogin } from "../../../types/employeeLogin";
import EmployeeLoginAddEditModal from "../../../components/modals/AddEmployeeModal";
import { FIRESTORE_PATHS } from "../../../constants/firestorePaths";

export default function EmployeeLoginPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<EmployeeLogin | null>(null);

  const columns = useMemo<ColumnDef<EmployeeLogin>[]>(() => [
    { accessorKey: "employeeId", header: "Employee ID" },
    { accessorKey: "employeeName", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "role", header: "Role" },
  ], []);

  return (
    <>
      <DataTable<EmployeeLogin>
        title="Employee Logins"
        collectionPath={FIRESTORE_PATHS.EMPLOYEE_LOGIN}
        columns={columns}
        hideImportExport
        onAdd={() => setModalOpen(true)}
        onEdit={(row) => {
          setSelected(row);
          setModalOpen(true);
        }}
      />

      {/* {modalOpen && (
        <EmployeeLoginAddEditModal
          open={modalOpen}
          title={selected ? "Edit Employee" : "Add Employee"}
          initial={selected}
          onClose={() => {
            setModalOpen(false);
            setSelected(null);
          }}
        />
      )} */}
    </>
  );
}
