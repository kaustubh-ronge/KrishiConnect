
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReview } from "@/actions/reviews"; // Make sure this path matches
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function ReviewFormClient({ orderId, product, userId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (formData) => {
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }

    // Append manual data
    formData.append("rating", rating);
    formData.append("orderId", orderId);
    formData.append("productId", product.id);

    startTransition(async () => {
      const res = await createReview(formData);
      if (res.success) {
        toast.success("Review Submitted! Thank you.");
        router.push("/my-orders");
      } else {
        toast.error(res.error || "Failed to submit review");
      }
    });
  };

  return (
    <Card className="w-full max-w-lg shadow-xl border-green-100">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-gray-900">Write a Review</CardTitle>
        <p className="text-gray-500 text-sm">How was your experience with this product?</p>
      </CardHeader>

      <form action={handleSubmit}>
        <CardContent className="space-y-6">

          {/* Product Preview */}
          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="relative w-16 h-16 bg-white rounded-md overflow-hidden border border-gray-200 shrink-0">
              {product.images?.[0] ? (
                <Image src={product.images[0]} alt="Product" fill className="object-cover" />
              ) : <div className="w-full h-full bg-gray-200" />}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 line-clamp-1">{product.productName}</h4>
              <p className="text-xs text-gray-500">Unit Price: ₹{product.pricePerUnit}</p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Overall Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-green-600 font-medium h-4">
              {rating === 5 ? "Excellent!" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating > 0 ? "Poor" : ""}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-semibold text-gray-700">Your Review</label>
            <Textarea
              id="comment"
              name="comment"
              placeholder="What did you like or dislike about the produce quality or delivery?"
              className="min-h-[100px] resize-y"
            />
          </div>

        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]">
            {isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}