// export interface Client {
//   id?: string;
//   name: string;
//   address: string;
//   billingname: string;
//   clientType: string;
//   contactNo: string;
//   contactPerson: string;
//   creditLimit: number;
//   email: string;
//   gstNo: string;
//   insertedOn: Date; // Firestore timestamp parsed as JS Date
//   mobile: string;
//   openingBalance: number;
//   openingBalanceType: string;
//   state: string;
//   updatedOn: Date; // Firestore timestamp parsed as JS Date
//   balance: number;
// }


export interface Client {
  id?: string;
  name: string;
  address: string;
  billingname: string;
  clientType: "Customer" | "Supplier" | "";
  contactNo: string;
  contactPerson: string;
  creditLimit: number;
  email: string;
  gstNo: string;
  insertedOn: Date; // Firestore timestamp parsed as JS Date
  mobile: string;
  openingBalance: number;
  openingBalanceType: "PAY" | "COLLECT" | "";
  state: string;
  updatedOn: Date; // Firestore timestamp parsed as JS Date
  balance: number;
  panNo: string;
  tanNo: string;
  vendorCode: string;
  landlineNo: string;
  clientGroup: string;
}
