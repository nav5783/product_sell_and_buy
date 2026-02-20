

// src/pages/master-data/index.tsx
import { Link } from "react-router-dom";
import {
  FaUserTie,
  FaFileInvoiceDollar,
  FaUsers,
  FaPrint,
  FaPaintBrush,
  FaNewspaper,
  FaRupeeSign,
  FaCheckSquare,
  FaCubes,
  FaShareAlt,
  FaUniversity,
  FaDatabase,
  FaShoppingCart,
} from "react-icons/fa";

const MasterData = () => {
  const items = [
    {
      to: "/master-data/employee",
      label: "Employee Master",
      icon: <FaUserTie className="text-4xl text-purple-500" />,
    },
    // {
    //   to: "/master-data/tax",
    //   label: "Tax Master",
    //   icon: <FaFileInvoiceDollar className="text-4xl text-purple-500" />,
    // },
    {
      to: "/master-data/client",
      label: "Client Master",
      icon: <FaUsers className="text-4xl text-purple-500" />,
    },
    // {
    //   to: "/master-data/flex-items",
    //   label: "Flex Item Master",
    //   icon: <FaPrint className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/digital-items",
    //   label: "Digital Item Master",
    //   icon: <FaPaintBrush className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/offset-items",
    //   label: "Offset Item Master",
    //   icon: <FaNewspaper className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/customer-rates",
    //   label: "Customer wise Rates",
    //   icon: <FaRupeeSign className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/job-status",
    //   label: "Job Status Master",
    //   icon: <FaCheckSquare className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/machine",
    //   label: "Machine Master",
    //   icon: <FaCubes className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/outsource",
    //   label: "Outsource Master",
    //   icon: <FaShareAlt className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/bank",
    //   label: "Bank Master",
    //   icon: <FaUniversity className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/backup",
    //   label: "Backup",
    //   icon: <FaDatabase className="text-4xl text-purple-500" />,
    // },
    // {
    //   to: "/master-data/general-items",
    //   label: "General Item Master",
    //   icon: <FaShoppingCart className="text-4xl text-purple-500" />,
    // },
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-purple-500 text-white font-semibold px-4 py-2 rounded-t">
        Master Data
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 bg-white rounded-b shadow">
        {items.map((item, i) => (
          <Link
            key={i}
            to={item.to}
            className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded shadow-sm py-6 
                       hover:shadow-lg hover:border-purple-500 hover:scale-105 transition-transform duration-200"
          >
            {item.icon}
            <span className="mt-2 font-medium text-gray-700 text-center">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MasterData;
