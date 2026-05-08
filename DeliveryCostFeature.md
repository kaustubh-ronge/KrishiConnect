1. The "Total Distance" Logic (The 3-Point Calc)
To prevent the high-cost issue, we must calculate the Total Job Distance when hiring:

Distance A: Partner's current location → Seller (Pickup)
Distance B: Seller → Buyer (Drop-off)
Total Cost = (Distance A + Distance B) × Partner Rate.
Why this helps: In your example, if the seller hires a partner near the buyer, Distance A will be huge. The system will immediately show a very high Total Cost, and the seller will see a "Loss" warning. This forces the seller to pick the most efficient partner.

2. Edge Case Scenarios to Tackle
Edge Case 1: The "Weight & Vehicle" Mismatch

Scenario: A seller has 500kg of potatoes. A partner with a Bicycle is nearby and cheap, but they can't carry the load.
Risk: Seller hires them, they arrive, realize they can't take it, and the seller loses time and trust.
Fix: We must filter partners by Vehicle Type based on the order weight.
Edge Case 2: The "Perishable" Deadline

Scenario: Seller is selling fresh milk. A partner is 30km away from the seller. By the time they pick up and deliver, the milk is in the heat for 3 hours.
Risk: Buyer receives spoiled goods.
Fix: For categories like "Dairy" or "Fresh Greens," we should limit the Pickup Radius to 5-10km only.
Edge Case 3: The "Ghost" Branch (Agent Scenario)

Scenario: As you said, an Agent has a branch near the buyer.
Risk: The system calculates from the Main Office (far), making the product look too expensive for the buyer.
Fix: We should eventually add a "Dispatch Locations" feature for Agents. If a branch is closer, the price drops.
Edge Case 4: The "Dead-End" Route

Scenario: The seller is in a remote village with only one road. A delivery boy enters the village to pick up, but has no other jobs there.
Risk: Delivery boys will charge double because they have to return "empty" (Dry Run).
Fix: We should add a "Return Trip" bonus or a slightly higher rate for remote pickups.
3. The "Trust" Fix: Serviceability Radius
To protect both sides, we should implement a Serviceability Radius:

Seller Side: When creating a listing, the seller chooses their "Max Delivery Range" (e.g., 50km).
Buyer Side: If a buyer is 100km away, they see: "This product is outside your delivery zone. Contact seller for special transport."