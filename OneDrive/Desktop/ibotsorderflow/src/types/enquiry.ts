// src/types/enquiry.ts

import type { Timestamp } from "firebase/firestore";

// Type alias for the different statuses an enquiry can have
export type EnquiryStatus =
  | "Enquiry"
  | "Quote"
  | "Sales"
  | "Dispatched"
  | "Paid"
  | "Dropped";

// Type alias for the different modes or sources of an enquiry
export type EnquiryMode =
  | "WhatsApp"
  | "FB"
  | "Website"
  | "Instagram"
  | "Mail"
  | "LinkedIn"
  | "OwnerDirect"
  | "Offline";

// Type alias for the type of enquiry (Business-to-Business or Business-to-Consumer)
export type EnquiryType = "B2B" | "B2C";

// Interface for an entry in the status history log
export interface StatusHistoryEntry {
  status: EnquiryStatus;
  updatedBy: string; // Job ID of the employee who updated the status
  timestamp: any;    // Firestore Timestamp for when the update occurred
  remarks?: string;  // Optional remarks for the status change
}

// Customer information interface
export interface CustomerInfo {
  name?: string;
  contact?: string;
  email?: string;
  city?: string;
  company?: string;
}

// Main interface for an Enquiry document
export interface Enquiry {
  // --- System generated fields ---
  id?: string;        // Firestore document ID (optional)
  enqId?: string;     // Human-readable ID, e.g., "ENQ-2025-0001"
  createdAt?: any;    // Firestore Timestamp when the enquiry was created
  updatedAt?: any;    // Firestore Timestamp when the enquiry was last updated
  paidDate?: Timestamp; 

  // --- Enquiry details ---
  mode?: EnquiryMode;
  source?: string;
  type?: EnquiryType;
  value?: number;      // The estimated value or amount of the enquiry

  // --- Status tracking ---
  status?: EnquiryStatus;
  paymentStatus?: string;
  dispatched?: boolean;
  remarks?: string;   // General remarks or comments on the enquiry
  statusHistory: StatusHistoryEntry[]; // An array to log all status changes

  // --- Assignment details ---
  assignedTo?: string; // Job ID of the employee the enquiry is assigned to
  createdBy?: string;  // Job ID of the employee who created the enquiry
  teamId?: string;    // Optional team ID if assigned to a team

  // --- Customer details ---
  customer?: CustomerInfo; // <- added
}