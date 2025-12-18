"use client";

import { useState, useEffect } from "react";
import { Package, PackageCheck, Truck, MapPin, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { getOrderTracking } from "@/actions/order-tracking";

const statusConfig = {
  PROCESSING: {
    icon: Clock,
    label: "Processing",
    color: "text-blue-600",
    bg: "bg-blue-100",
    description: "Your order is being prepared"
  },
  PACKED: {
    icon: Package,
    label: "Packed",
    color: "text-purple-600",
    bg: "bg-purple-100",
    description: "Your order has been packed"
  },
  SHIPPED: {
    icon: Truck,
    label: "Shipped",
    color: "text-orange-600",
    bg: "bg-orange-100",
    description: "Your order is on the way"
  },
  IN_TRANSIT: {
    icon: MapPin,
    label: "In Transit",
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    description: "Your order is being delivered"
  },
  DELIVERED: {
    icon: CheckCircle2,
    label: "Delivered",
    color: "text-green-600",
    bg: "bg-green-100",
    description: "Your order has been delivered"
  }
};

const statusOrder = ['PROCESSING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];

export default function OrderTrackingTimeline({ orderId, currentStatus }) {
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTracking() {
      const res = await getOrderTracking(orderId);
      if (res.success) {
        setTracking(res.data);
      }
      setLoading(false);
    }
    loadTracking();
  }, [orderId]);

  const currentStatusIndex = statusOrder.indexOf(currentStatus);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Order Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Status Stepper */}
        <div className="relative">
          {statusOrder.map((status, index) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const trackingEntry = tracking.find(t => t.status === status);

            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pb-8 last:pb-0"
              >
                {/* Vertical Line */}
                {index < statusOrder.length - 1 && (
                  <div
                    className={`absolute left-5 top-12 w-0.5 h-full -ml-px ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Status Item */}
                <div className="relative flex items-start gap-4">
                  {/* Icon Circle */}
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isCurrent
                        ? `${config.bg} ${config.color} border-current`
                        : 'bg-gray-100 border-gray-300'
                    } transition-all duration-300`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isCompleted ? 'text-white' : isCurrent ? config.color : 'text-gray-400'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-3 mb-1">
                      <h4
                        className={`font-semibold ${
                          isCompleted ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {config.label}
                      </h4>
                      {isCurrent && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          Current
                        </Badge>
                      )}
                      {isCompleted && !isCurrent && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{config.description}</p>

                    {/* Tracking Details */}
                    {trackingEntry && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-2">
                        {trackingEntry.notes && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Note:</span> {trackingEntry.notes}
                          </p>
                        )}
                        {trackingEntry.transportProvider && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Transport:</span>{' '}
                            {trackingEntry.transportProvider}
                          </p>
                        )}
                        {trackingEntry.vehicleNumber && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Vehicle:</span>{' '}
                            {trackingEntry.vehicleNumber}
                          </p>
                        )}
                        {trackingEntry.driverName && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Driver:</span>{' '}
                            {trackingEntry.driverName}
                            {trackingEntry.driverPhone && ` (${trackingEntry.driverPhone})`}
                          </p>
                        )}
                        {trackingEntry.currentLocation && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Location:</span>{' '}
                            {trackingEntry.currentLocation}
                          </p>
                        )}
                        {trackingEntry.estimatedDelivery && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Est. Delivery:</span>{' '}
                            {new Date(trackingEntry.estimatedDelivery).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(trackingEntry.createdAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

