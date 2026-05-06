
import { farmerSchema, agentSchema, deliverySchema } from '../lib/zodSchema.js';

const testCases = [
  {
    name: "Farmer 'Buy' profile - Empty Bank Details",
    schema: farmerSchema,
    data: {
      name: "John Doe",
      phone: "9876543210",
      address: "123 Farm Road",
      country: "IN",
      state: "Maharashtra",
      city: "Pune",
      pincode: "411001",
      primaryProduce: ["Tomatoes"],
      usagePurpose: "buy",
      aadharNumber: "",
      upiId: "",
      bankName: "",
      ifscCode: "",
      accountNumber: ""
    },
    expected: true
  },
  {
    name: "Farmer 'Buy & Sell' profile - Missing Bank Details",
    schema: farmerSchema,
    data: {
      name: "Jane Doe",
      phone: "9876543211",
      address: "456 Crop Lane",
      country: "IN",
      state: "Maharashtra",
      city: "Nashik",
      pincode: "422001",
      primaryProduce: ["Onions"],
      usagePurpose: "buy_and_sell",
      aadharNumber: "",
      upiId: "",
      bankName: "",
      ifscCode: "",
      accountNumber: ""
    },
    expected: false
  },
  {
    name: "Agent 'Buy & Sell' profile - Invalid Aadhar",
    schema: agentSchema,
    data: {
      name: "Agent Smith",
      phone: "8888877777",
      address: "Market Yard",
      country: "IN",
      state: "Gujarat",
      city: "Surat",
      pincode: "395003",
      agentType: ["Wholesale Buyer"],
      usagePurpose: "buy_and_sell",
      aadharNumber: "1234", // Too short
      upiId: "agent@upi",
      bankName: "SBI",
      ifscCode: "SBIN0001234",
      accountNumber: "1234567890"
    },
    expected: false
  },
  {
    name: "Delivery Partner - Missing License Image",
    schema: deliverySchema,
    data: {
      name: "Speedy Sam",
      phone: "7777766666",
      address: "Delivery Hub",
      country: "IN",
      state: "Karnataka",
      city: "Bangalore",
      pincode: "560001",
      vehicleType: "Bike",
      vehicleNumber: "KA01AB1234",
      licenseNumber: "DL123456789",
      aadharNumber: "123456789012",
      radius: 15,
      pricePerKm: 6,
      aadharFront: "url1",
      aadharBack: "url2",
      licenseImage: "", // Missing
      upiId: "sam@upi",
      bankName: "HDFC",
      ifscCode: "HDFC0001234",
      accountNumber: "9876543210"
    },
    expected: false
  }
];

console.log("--- Starting Validation Hardening Tests ---");

testCases.forEach(tc => {
  try {
    tc.schema.parse(tc.data);
    if (tc.expected) {
      console.log(`✅ PASS: ${tc.name}`);
    } else {
      console.log(`❌ FAIL: ${tc.name} (Expected validation error but passed)`);
    }
  } catch (err) {
    if (!tc.expected) {
      const msg = err.errors ? err.errors[0]?.message : err.message;
      console.log(`✅ PASS: ${tc.name} (Caught expected error: ${msg})`);
    } else {
      const msg = err.errors ? err.errors[0]?.message : err.message;
      console.log(`❌ FAIL: ${tc.name} (Unexpected error: ${msg})`);
    }
  }
});
