import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../firebase"; // Import Firebase Auth

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);

  // Booking Form State
  const [members, setMembers] = useState(1);
  const [travelDate, setTravelDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/tours");
        const found = res.data.find((p) => p._id === id);
        setPkg(found);
      } catch (err) { console.error(err); }
    };
    fetchPackage();
  }, [id]);

  // Calculate Price & GST
  useEffect(() => {
    if (pkg) {
      const { flight, hotel, food, transport, guide } = pkg.costs;
      const oneTimeCost = (flight + transport + guide) * members;
      const dailyCost = (hotel + food) * members * pkg.duration;
      const subTotal = oneTimeCost + dailyCost;
      const gst = (subTotal * pkg.gstRate || 18) / 100; // Default 18% if missing
      setTotalPrice(Math.floor(subTotal + gst));
    }
  }, [members, pkg]);

  // Calculate End Date Logic
  const getEndDate = () => {
    if (!travelDate || !pkg) return "Select Start Date";
    const start = new Date(travelDate);
    const end = new Date(start);
    end.setDate(start.getDate() + pkg.duration);
    return end.toDateString();
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    // 1. Auth Check (The "Login First" rule)
    if (!auth.currentUser) {
      alert("Please Login or Register to Book!");
      navigate("/login");
      return;
    }

    if (!travelDate || !phone || !address) {
      alert("Please fill all booking details.");
      return;
    }

    // 2. Prepare Data
    const bookingData = {
      userEmail: auth.currentUser.email,
      fullName: auth.currentUser.displayName || "Customer",
      phone: phone,
      address: address, // NEW FIELD
      packageId: pkg._id,
      packageName: pkg.title,
      members: members,
      travelDate: new Date(travelDate),
      endDate: new Date(getEndDate()), // Save the auto-calculated date
      totalAmount: totalPrice,
      gstAmount: Math.floor((totalPrice * 18) / 118), // Rough reverse calc
      breakdown: {
        flight: pkg.costs.flight * members,
        hotel: pkg.costs.hotel * members * pkg.duration,
        food: pkg.costs.food * members * pkg.duration,
        transport: pkg.costs.transport * members,
        guide: pkg.costs.guide * members
      }
    };

    // 3. Send to Backend (Triggers Email)
    try {
      await axios.post("http://localhost:5000/api/bookings", bookingData);
      alert("Booking Confirmed! Receipt sent to email.");
      navigate("/dashboard");
    } catch (err) {
      alert("Booking Failed.");
    }
  };

  if (!pkg) return <h2>Loading...</h2>;

  return (
    <div style={{ maxWidth: "1200px", margin: "auto", padding: "20px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
      
      {/* LEFT: DETAILS */}
      <div>
        <h1>{pkg.title}</h1>
        <img src={pkg.image} style={{ width: "100%", borderRadius: "10px" }} alt="tour" />
        <p style={{ marginTop: "20px", fontSize: "1.1rem" }}>{pkg.description}</p>
        
        <h3>📍 Places You Will Visit</h3>
        {/* If you have images for places, map them here */}
        
        <h3>📅 Itinerary ({pkg.duration} Days)</h3>
        <p>Day 1: Arrival & Transport...</p>
        <p>Day {pkg.duration}: Departure...</p>
      </div>

      {/* RIGHT: BOOKING FORM */}
      <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", height: "fit-content", position: "sticky", top: "20px" }}>
        <h2>Book This Trip</h2>
        
        <form onSubmit={handleBooking} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <div>
            <label>Start Date:</label>
            <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} required style={styles.input} />
          </div>

          <div style={{ background: "#eef", padding: "10px", borderRadius: "5px" }}>
            <strong>End Date (Auto):</strong> <br/> {getEndDate()}
          </div>

          <div>
            <label>Number of Travelers:</label>
            <input type="number" min="1" value={members} onChange={(e) => setMembers(parseInt(e.target.value))} required style={styles.input} />
          </div>

          <div>
            <label>Contact Number:</label>
            <input type="tel" placeholder="Your Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required style={styles.input} />
          </div>

          <div>
            <label>Address:</label>
            <textarea placeholder="Your Full Address" value={address} onChange={(e) => setAddress(e.target.value)} required style={{...styles.input, height: "60px"}} />
          </div>

          <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "5px" }}>
            <h4>💰 Cost Breakdown</h4>
            <div style={styles.row}><span>Flight & Transport:</span> <span>${(pkg.costs.flight + pkg.costs.transport) * members}</span></div>
            <div style={styles.row}><span>Hotel ({pkg.duration} Nights):</span> <span>${pkg.costs.hotel * members * pkg.duration}</span></div>
            <div style={styles.row}><span>Food & Dining:</span> <span>${pkg.costs.food * members * pkg.duration}</span></div>
            <div style={styles.row}><span>Guide & Entry:</span> <span>${pkg.costs.guide * members}</span></div>
            <hr />
            <div style={styles.row}><strong>Total Price:</strong> <strong style={{color:"green"}}>${totalPrice}</strong></div>
          </div>

          <button type="submit" style={styles.bookBtn}>Confirm & Pay</button>
        </form>
      </div>

    </div>
  );
};

const styles = {
  input: { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" },
  row: { display: "flex", justifyContent: "space-between", marginBottom: "5px" },
  bookBtn: { width: "100%", padding: "15px", background: "#ff4757", color: "white", border: "none", borderRadius: "5px", fontSize: "18px", cursor: "pointer", fontWeight: "bold" }
};

export default PackageDetails;