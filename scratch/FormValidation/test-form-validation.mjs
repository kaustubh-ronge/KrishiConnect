
import { farmerSchema, agentSchema, createListingSchema, deliverySchema } from '../lib/zodSchema.js';

const testCases = {
    farmer: [
        {
            name: "Valid Farmer (Min Data)",
            data: {
                name: "John Doe",
                phone: "9876543210",
                address: "Village Road 123",
                country: "India",
                state: "Maharashtra",
                city: "Pune",
                pincode: "411001",
                primaryProduce: ["Rice"],
                usagePurpose: "buy_and_sell"
            },
            expectSuccess: true
        },
        {
            name: "Invalid Phone (Short)",
            data: { phone: "123" },
            expectSuccess: false
        },
        {
            name: "Invalid Aadhar (Letters)",
            data: { 
                name: "John Doe",
                phone: "9876543210",
                address: "Village Road 123",
                country: "India",
                state: "Maharashtra",
                city: "Pune",
                pincode: "411001",
                primaryProduce: ["Rice"],
                usagePurpose: "buy_and_sell",
                aadharNumber: "12345678901A" 
            },
            expectSuccess: false
        }
    ],
    listing: [
        {
            name: "Valid Product Listing",
            data: {
                productName: "Fresh Tomatoes",
                availableStock: "500",
                pricePerUnit: "20",
                unit: "kg",
                deliveryCharge: "50",
                deliveryChargeType: "flat",
                images: ["http://example.com/img.jpg"]
            },
            expectSuccess: true
        },
        {
            name: "Negative Price",
            data: {
                productName: "Bad Price",
                availableStock: 100,
                pricePerUnit: -10,
                unit: "kg",
                deliveryCharge: 0,
                deliveryChargeType: "flat",
                images: ["img.jpg"]
            },
            expectSuccess: false
        }
    ],
    delivery: [
        {
            name: "Valid Delivery Partner",
            data: {
                name: "Speedy Delivery",
                phone: "9000000000",
                address: "City Center",
                country: "India",
                state: "Karnataka",
                city: "Bangalore",
                pincode: "560001",
                vehicleType: "Bike",
                vehicleNumber: "KA01 AB 1234",
                licenseNumber: "DL1234567890",
                aadharNumber: "112233445566",
                radius: "15",
                pricePerKm: "5"
            },
            expectSuccess: true
        }
    ]
};

function runTests() {
    console.log("=== KRISHICONNECT FORM VALIDATION SCRATCH TEST ===\n");
    let passed = 0;
    let failed = 0;

    for (const [category, cases] of Object.entries(testCases)) {
        console.log(`\n--- Testing ${category.toUpperCase()} Schema ---`);
        const schema = category === 'farmer' ? farmerSchema : (category === 'listing' ? createListingSchema : deliverySchema);
        
        cases.forEach(tc => {
            try {
                const result = schema.safeParse(tc.data);
                if (result.success === tc.expectSuccess) {
                    console.log(`✅ [PASS] ${tc.name}`);
                    passed++;
                } else {
                    console.log(`❌ [FAIL] ${tc.name}`);
                    console.log("   Expected:", tc.expectSuccess ? "Success" : "Failure");
                    console.log("   Got:", result.success ? "Success" : "Failure");
                    if (!result.success) {
                        console.log("   Errors:", result.error.errors.map(e => e.message).join(", "));
                    }
                    failed++;
                }
            } catch (err) {
                console.log(`💥 [ERROR] ${tc.name}:`, err.message);
                failed++;
            }
        });
    }

    console.log(`\n\n=== TEST SUMMARY ===`);
    console.log(`TOTAL: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
}

runTests();
