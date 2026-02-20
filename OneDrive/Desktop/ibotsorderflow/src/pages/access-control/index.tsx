import { Link } from "react-router-dom";
import { UserPlus, Settings } from "lucide-react";

const AccessControl = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-purple-500 text-white px-4 py-3 rounded mb-6 font-semibold">
        Access Control
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Employee Login */}
        <Link
          to="/access-control/employee-login"
          className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md 
                     hover:shadow-xl hover:bg-purple-50 transition-all duration-200 border border-gray-200"
        >
          <UserPlus className="w-12 h-12 text-purple-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">
            Create Employee Login
          </h2>
        </Link>

        {/* Permissions */}
        <Link
          to="/access-control/permissions"
          className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md 
                     hover:shadow-xl hover:bg-purple-50 transition-all duration-200 border border-gray-200"
        >
          <Settings className="w-12 h-12 text-purple-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">
            Permissions
          </h2>
        </Link>
      </div>
    </div>
  );
};

export default AccessControl;
