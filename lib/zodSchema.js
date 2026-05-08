import { z } from 'zod';

export const farmerSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Phone number must be exactly 10 digits and start with 6-9"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  lat: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : parseFloat(val), z.number().optional()),
  lng: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : parseFloat(val), z.number().optional()),
  primaryProduce: z.array(z.string()).min(1, "Please select at least one primary produce"),
  usagePurpose: z.enum(["buy", "buy_and_sell"], { required_error: "Please select a profile purpose" }),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be exactly 12 digits").optional().or(z.literal("")),
  farmName: z.string().optional().or(z.literal("")),
  farmSize: z.string().optional().or(z.literal("")),
  farmingExperience: z.string().optional().or(z.literal("")),
  upiId: z.string().regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Please enter a valid UPI ID").optional().or(z.literal("")),
  bankName: z.string().min(2, "Bank Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Bank Name can only contain letters and spaces").optional().or(z.literal("")),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code (must be 11 characters like SBIN0123456)").optional().or(z.literal("")),
  accountNumber: z.string().regex(/^\d{9,18}$/, "Account number must be between 9 to 18 digits").optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.usagePurpose === "buy_and_sell") {
    if (!data.aadharNumber || data.aadharNumber === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Aadhar Number is required for selling", path: ["aadharNumber"] });
    }
    if (!data.upiId || data.upiId === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "UPI ID is required for receiving payments", path: ["upiId"] });
    }
    if (!data.bankName || data.bankName === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank Name is required for receiving payments", path: ["bankName"] });
    }
    if (!data.ifscCode || data.ifscCode === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "IFSC Code is required for receiving payments", path: ["ifscCode"] });
    }
    if (!data.accountNumber || data.accountNumber === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account Number is required for receiving payments", path: ["accountNumber"] });
    }
  }
});

export const agentSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters").regex(/^[\p{L}\s.'-]+$/u, "Name can only contain letters, spaces, apostrophes, hyphens, and dots"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Phone number must be exactly 10 digits and start with 6-9"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  lat: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : parseFloat(val), z.number().optional()),
  lng: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : parseFloat(val), z.number().optional()),
  region: z.string().optional().or(z.literal("")),
  agentType: z.array(z.string()).min(1, "Please select at least one Agent Type"),
  companyName: z.string().optional().or(z.literal("")),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be exactly 12 digits").optional().or(z.literal("")),
  usagePurpose: z.enum(["buy", "buy_and_sell"], { required_error: "Please select a profile purpose" }),
  upiId: z.string().regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Please enter a valid UPI ID").optional().or(z.literal("")),
  bankName: z.string().min(2, "Bank Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Bank Name can only contain letters and spaces").optional().or(z.literal("")),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code (must be 11 characters like SBIN0123456)").optional().or(z.literal("")),
  accountNumber: z.string().regex(/^\d{9,18}$/, "Account number must be between 9 to 18 digits").optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.usagePurpose === "buy_and_sell") {
    if (!data.aadharNumber || data.aadharNumber === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Aadhar Number is required for selling", path: ["aadharNumber"] });
    }
    if (!data.upiId || data.upiId === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "UPI ID is required for receiving payments", path: ["upiId"] });
    }
    if (!data.bankName || data.bankName === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank Name is required for receiving payments", path: ["bankName"] });
    }
    if (!data.ifscCode || data.ifscCode === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "IFSC Code is required for receiving payments", path: ["ifscCode"] });
    }
    if (!data.accountNumber || data.accountNumber === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account Number is required for receiving payments", path: ["accountNumber"] });
    }
  }
});

export const createListingSchema = z.object({
  productName: z.string().min(3, "Product name must be at least 3 characters").max(100, "Product name is too long"),
  category: z.string().min(1, "Please select a category"),
  variety: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  availableStock: z.preprocess((value) => {
    if (typeof value === "string") return parseFloat(value);
    return value;
  }, z.number().positive("Available stock must be greater than 0")),
  pricePerUnit: z.preprocess((value) => {
    if (typeof value === "string") return parseFloat(value);
    return value;
  }, z.number().positive("Price per unit must be greater than 0")),
  minOrderQuantity: z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    if (typeof value === "string") return parseFloat(value);
    return value;
  }, z.number().positive("Min order quantity must be greater than 0").optional()),
  unit: z.enum(["kg", "ton", "quintal", "crate", "box"]),
  deliveryCharge: z.preprocess((value) => {
    if (typeof value === "string") return parseFloat(value);
    return value;
  }, z.number().min(0, "Delivery charge cannot be negative")),
  deliveryChargeType: z.enum(["per_unit", "flat"]),
  qualityGrade: z.string().optional().or(z.literal("")),
  shelfLife: z.string().optional().or(z.literal("")),
  whatsappNumber: z.string().optional().or(z.literal("")),
  harvestDate: z.string().optional().or(z.literal("")),
  shelfLifeStartDate: z.string().optional().or(z.literal("")),
  maxDeliveryRange: z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    if (typeof value === "string") return parseFloat(value);
    return value;
  }, z.number().positive("Max delivery range must be positive").optional()),
  images: z.array(z.string().min(1)).min(1, "Please upload at least one image"),
});

export const deliverySchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Phone number must be exactly 10 digits and start with 6-9"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  lat: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : parseFloat(val), z.number().optional()),
  lng: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : parseFloat(val), z.number().optional()),
  
  vehicleType: z.string().min(1, "Vehicle Type is required"),
  vehicleNumber: z.string().min(1, "Vehicle Plate Number is required"),
  licenseNumber: z.string().min(1, "Driving License Number is required"),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be exactly 12 digits"),

  radius: z.preprocess((val) => parseFloat(val), z.number().min(1, "Minimum service radius is 1 KM")),
  pricePerKm: z.preprocess((val) => parseFloat(val), z.number().min(0, "Price per KM cannot be negative")),
  aadharFront: z.string().min(1, "Aadhar front image is required"),
  aadharBack: z.string().min(1, "Aadhar back image is required"),
  licenseImage: z.string().min(1, "Driving license image is required"),
  upiId: z.string().regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Please enter a valid UPI ID"),
  bankName: z.string().min(2, "Bank Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Bank Name can only contain letters and spaces"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code (must be 11 characters like SBIN0123456)"),
  accountNumber: z.string().regex(/^\d{9,18}$/, "Account number must be between 9 to 18 digits"),
});
