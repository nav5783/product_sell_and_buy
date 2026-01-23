import { useLocation, Link } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable"; // For the table inside PDF

const BookingSuccess = () => {
  const location = useLocation();
  const booking = location.state?.booking; // Get data passed from previous page

  if (!booking) return <h2>No Booking Found. <Link to="/">Go Home</Link></h2>;

  // --- AUTOMATIC PDF GENERATOR ---
  const downloadReceipt = () => {
    const doc = new jsPDF();

    // 1. Header
    doc.setFontSize(20);
    doc.setTextColor(40, 167, 69); // Green Color
    doc.text("Booking Confirmed!", 105, 20, null, "center");
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Thank you for choosing Tourist Management App", 105, 30, null, "center");

    // 2. Booking Details
    doc.text(`Booking ID: ${booking._id}`, 20, 50);
    doc.text(`Date: ${new Date(booking.travelDate).toDateString()}`, 20, 60);
    doc.text(`Customer: ${booking.fullName}`, 20, 70);
    doc.text(`Tour Package: ${booking.packageName}`, 20, 80);

    // 3. Cost Breakdown Table
    doc.autoTable({
      startY: 90,
      head: [['Description', 'Cost']],
      body: [
        ['Flight & Transport', `$${booking.breakdown.flight + booking.breakdown.transport}`],
        ['Hotel & Accommodation', `$${booking.breakdown.hotel}`],
        ['Food & Dining', `$${booking.breakdown.food}`],
        ['Guide Charges', `$${booking.breakdown.guide}`],
        ['GST Tax', `$${booking.gstAmount}`],
        ['TOTAL PAID', `$${booking.totalAmount}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69] } // Green Header
    });

    // 4. Footer
    doc.text("Authorized Signature", 150, doc.lastAutoTable.finalY + 30);
    doc.text("Admin Team", 150, doc.lastAutoTable.finalY + 40);

    // 5. Save
    doc.save(`Receipt_${booking._id}.pdf`);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px", padding: "20px" }}>
      <h1 style={{ color: "green", fontSize: "3rem" }}>✅ Booking Successful!</h1>
      <p style={{ fontSize: "1.2rem", color: "#555" }}>
        Your trip to <b>{booking.packageName}</b> is confirmed.
      </p>
      <p>A confirmation email has been sent to <b>{booking.userEmail}</b>.</p>

      <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "20px" }}>
        <button 
          onClick={downloadReceipt} 
          style={{ padding: "15px 30px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", fontSize: "18px", cursor: "pointer" }}
        >
          📥 Download Receipt
        </button>

        <Link to="/home">
          <button style={{ padding: "15px 30px", background: "#6c757d", color: "white", border: "none", borderRadius: "5px", fontSize: "18px", cursor: "pointer" }}>
            🏠 Go Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccess;