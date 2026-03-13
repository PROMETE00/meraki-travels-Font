export type SearchCriteria = {
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  pax: number;
};

export type SearchResultItem = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  originCode: string;
  destinationCode: string;
  price: number;
  coverImageUrl: string | null;
};

export type SearchResponse = {
  items: SearchResultItem[];
};

export type BookingResponse = {
  id: number;
  customerId: number;
  customerEmail: string;
  customerName: string;
  packageId: number;
  packageTitle: string;
  originCode: string;
  destinationCode: string;
  startDate: string;
  endDate: string | null;
  totalPrice: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

export type BookingEventItem = {
  id: number;
  bookingId: number;
  type: string;
  actor: "CUSTOMER" | "ADMIN" | "STRIPE_WEBHOOK" | "SYSTEM";
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type PaymentIntentResponse = {
  clientSecret: string;
  paymentId: number;
  providerPaymentId: string;
};

export type PaymentHistoryItem = {
  id: number;
  bookingId: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  bookingStatus: string;
  packageTitle: string;
  originCode: string;
  destinationCode: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  checkoutUrl: string | null;
  providerPaymentId: string | null;
  refundIds: string[];
  createdAt: string;
};

export type AdminTravelPackageItem = {
  id: number;
  title: string;
  description: string | null;
  originCode: string;
  destinationCode: string;
  basePrice: number;
  coverImageUrl: string | null;
  active: boolean;
  createdAt: string;
};

export type AdminMediaFileItem = {
  name: string;
  url: string;
  size: number;
  lastModified: string;
};

export type AdminBannerItem = {
  id: number;
  title: string | null;
  subtitle: string | null;
  altText: string | null;
  linkUrl: string | null;
  imageUrl: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardMetrics = {
  totalCustomers: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalPayments: number;
  succeededPayments: number;
  refundedPayments: number;
  grossRevenue: number;
  refundedAmount: number;
};

export type AdminCustomerItem = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN" | "OPERATIONS";
  createdAt: string;
};

export type AdminCustomerOverviewResponse = {
  customer: AdminCustomerItem;
  metrics: {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalPayments: number;
    succeededPayments: number;
    refundedPayments: number;
  };
  bookings: BookingResponse[];
  payments: PaymentHistoryItem[];
};

export type AdminIncidentTicketItem = {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  bookingId: number | null;
  packageTitle: string | null;
  bookingStatus: string | null;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  internalNote: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerIncidentTicketItem = {
  id: number;
  bookingId: number | null;
  packageTitle: string | null;
  bookingStatus: string | null;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IncidentTicketCommentItem = {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  authorEmail: string;
  actor: "CUSTOMER" | "ADMIN";
  message: string;
  createdAt: string;
};

export type AdminDashboardResponse = {
  metrics: AdminDashboardMetrics;
  recentBookings: BookingResponse[];
  recentCustomers: AdminCustomerItem[];
};

export type CustomerSession = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN" | "OPERATIONS";
  createdAt: string;
};

export type ProfileUpdateRequest = {
  email: string;
  fullName?: string;
  phone?: string;
};

export type AuthRegisterRequest = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  customer: CustomerSession;
};

export type CustomerPreferencesResponse = {
  id: number | null;
  favoriteDestinations: string | null;
  preferredAirlines: string | null;
  dietaryRestrictions: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  specialNeeds: string | null;
  notes: string | null;
  updatedAt: string | null;
};

export type CustomerPreferencesRequest = {
  favoriteDestinations?: string;
  preferredAirlines?: string;
  dietaryRestrictions?: string;
  passportNumber?: string;
  passportExpiry?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  specialNeeds?: string;
  notes?: string;
};
