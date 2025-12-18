"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star, StarOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { createReview } from "@/actions/reviews";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReviewOrderClient({ order }) {
  const router = useRouter();
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleRatingChange = (productId, rating) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating
      }
    }));
  };

  const handleCommentChange = (productId, comment) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment
      }
    }));
  };

  const handleSubmitReview = async (productId) => {
    const review = reviews[productId];
    
    if (!review || !review.rating) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('orderId', order.id);
    formData.append('productId', productId);
    formData.append('rating', review.rating);
    if (review.comment) {
      formData.append('comment', review.comment);
    }

    const res = await createReview(formData);
    
    if (res.success) {
      toast.success(res.message);
      // Mark as submitted
      setReviews(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          submitted: true
        }
      }));
    } else {
      toast.error(res.error);
    }
    
    setSubmitting(false);
  };

  const allReviewsSubmitted = order.items.every(item => reviews[item.productId]?.submitted);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/my-orders">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Write Reviews</h1>
          <p className="text-gray-600">
            Share your experience with the products from Order #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>

        {allReviewsSubmitted ? (
          <Card className="text-center py-16">
            <CardContent>
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-6">All reviews have been submitted successfully.</p>
              <Button onClick={() => router.push('/my-orders')} className="bg-green-600 hover:bg-green-700">
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {order.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.product.images[0] ? (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.productName}
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{item.product.productName}</h3>
                        <p className="text-sm text-gray-500 font-normal">
                          Seller: {item.sellerName || (item.product.sellerType === 'farmer' 
                            ? item.product.farmer?.name 
                            : item.product.agent?.companyName)}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews[item.productId]?.submitted ? (
                      <div className="text-center py-8 bg-green-50 rounded-lg">
                        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <p className="text-green-700 font-medium">Review submitted!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Rating */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Rate this product *
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingChange(item.productId, star)}
                                className="transition-transform hover:scale-110 active:scale-95"
                              >
                                {reviews[item.productId]?.rating >= star ? (
                                  <Star className="h-10 w-10 fill-yellow-400 text-yellow-400" />
                                ) : (
                                  <StarOff className="h-10 w-10 text-gray-300" />
                                )}
                              </button>
                            ))}
                          </div>
                          {reviews[item.productId]?.rating && (
                            <p className="text-sm text-gray-600 mt-2">
                              {reviews[item.productId].rating} out of 5 stars
                            </p>
                          )}
                        </div>

                        {/* Comment */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Write your review (optional)
                          </label>
                          <Textarea
                            placeholder="Tell us about your experience with this product..."
                            rows={4}
                            value={reviews[item.productId]?.comment || ""}
                            onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                            className="resize-none"
                          />
                        </div>

                        {/* Submit Button */}
                        <Button
                          onClick={() => handleSubmitReview(item.productId)}
                          disabled={!reviews[item.productId]?.rating || submitting}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {submitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

