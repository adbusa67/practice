"use client";

import { Card } from "@event-ease/ui";
import { Calendar, Clock, MapPin, CircleUserRound, CreditCard, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";
import { type RegistrationWithDetails } from "./actions";
import { formatEventDate, formatEventTimeRange } from "@/lib/date-utils";

type RegistrationCardProps = {
  registration: RegistrationWithDetails;
};

export function RegistrationCard({ registration }: RegistrationCardProps) {
  const event = registration.events;
  const purchase = registration.ticket_purchases;
  const ticketType = purchase?.ticket_types;

  if (!event) {
    return null;
  }

  // Payment status styling
  const getPaymentStatusConfig = (status?: string, amount?: number, paymentMethod?: string) => {
    // Check if this is a free ticket
    if (paymentMethod === 'free' || amount === 0) {
      return {
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Free'
      };
    }

    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Paid'
        };
      case 'pending':
        return {
          icon: Loader,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Processing'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Failed'
        };
      case 'refunded':
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Refunded'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Free'
        };
    }
  };

  const paymentConfig = getPaymentStatusConfig(purchase?.payment_status, purchase?.amount_paid, purchase?.payment_method);
  const PaymentIcon = paymentConfig.icon;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  return (
    <Card className={`p-6 border-l-4 ${paymentConfig.borderColor}`}>
      <div className="flex items-start justify-between">
        {/* Left side - Event details */}
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {event.name}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{formatEventDate(event.date)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{formatEventTimeRange(event.start_time, event.end_time)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{event.venues?.name}</span>
                  {event.venues?.address && (
                    <span className="text-xs text-gray-500">• {event.venues.address}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CircleUserRound className="w-4 h-4 text-gray-500" />
                  <span>{event.organizers?.name}</span>
                  {event.organizers?.organizations && (
                    <span className="text-xs text-gray-500">
                      • {event.organizers.organizations.name} ({event.organizers.organizations.type})
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Payment status */}
        <div className="ml-6 text-right">
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${paymentConfig.bgColor} ${paymentConfig.borderColor} border`}>
            <PaymentIcon className={`w-4 h-4 ${paymentConfig.color}`} />
            <span className={`text-sm font-medium ${paymentConfig.color}`}>
              {paymentConfig.label}
            </span>
          </div>

          {/* Ticket and pricing info */}
          <div className="mt-4 space-y-1">
            {ticketType && (
              <div className="text-sm text-gray-600">
                <div className="font-medium">{ticketType.tier_name}</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(ticketType.price)}
                </div>
              </div>
            )}

            {purchase?.payment_method && purchase.payment_method !== 'free' && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                <CreditCard className="w-3 h-3" />
                <span className="capitalize">{purchase.payment_method}</span>
              </div>
            )}
          </div>

          {/* Registration date */}
          <div className="mt-4 text-xs text-gray-500">
            Registered {new Date(registration.registered_at || '').toLocaleDateString()}
          </div>
        </div>
      </div>
    </Card>
  );
}