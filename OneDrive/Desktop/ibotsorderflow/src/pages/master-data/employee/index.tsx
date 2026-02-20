

// src/pages/master-data/employee/index.tsx
import React, { useState } from "react";
import DataTable from "../../../components/Table/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import type { Employee } from "../../../types/employee";
import AddEditModal from "../../../components/modals/AddEditModal";
import { useCollection } from "../../../hooks/useCollections";
import { FIRESTORE_PATHS } from "../../../constants/firestorePaths";

export default function EmployeeMasterPage() {
  const columns: ColumnDef<Employee>[] = [
    { id: "name", accessorKey: "name", header: "Employee Name" },
    { id: "address", accessorKey: "address", header: "Address" },
    { id: "mobile", accessorKey: "mobile", header: "Mobile No" },
    { id: "email", accessorKey: "email", header: "Email Id" },
    { id: "defaultSalary", accessorKey: "defaultSalary", header: "Default Salary" },
    { id: "joiningDate", accessorKey: "joiningDate", header: "Joining Date" },
    { id: "leavingDate", accessorKey: "leavingDate", header: "Leaving Date" },
  ];

  const { create, update } = useCollection<Employee>(
    FIRESTORE_PATHS.EMPLOYEES
  );

  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<Employee | null>(null);

  const handleSave = async (payload: Employee) => {
    if (editRecord?.id) {
      await update(editRecord.id, payload);
    } else {
      await create(payload);
    }
    setShowModal(false);
    setEditRecord(null);
  };

  return (
    <div className="p-6">
      <DataTable<Employee>
        title="Employee Master"
        collectionPath={FIRESTORE_PATHS.EMPLOYEES}
        columns={columns}
        onAdd={() => setShowModal(true)}
        onEdit={(record) => { setEditRecord(record); setShowModal(true); }}
        // onView={(record) => alert(JSON.stringify(record, null, 2))}
      />

      {showModal && (
        <AddEditModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditRecord(null); }}
          onSave={handleSave}
          initial={editRecord ?? {}}
          title={editRecord ? "Edit Employee" : "Add Employee"}
        />
      )}
    </div>
  );
}
