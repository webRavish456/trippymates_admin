// Mock data for the admin panel

export interface Trip {
  id: string
  title: string
  destination: string
  duration: string
  price: number
  images: string[]
  description: string
  inclusions: string[]
  exclusions: string[]
  availability: number
  status: "active" | "inactive"
  category: string
}

export interface Booking {
  id: string
  tripId: string
  tripTitle: string
  userId: string
  userName: string
  userEmail: string
  bookingDate: string
  travelDate: string
  status: "confirmed" | "pending" | "cancelled"
  amount: number
  paymentStatus: "paid" | "pending" | "failed"
  guests: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  joinedDate: string
  totalBookings: number
  totalSpent: number
  status: "active" | "disabled"
}

export const mockTrips: Trip[] = [
  {
    id: "1",
    title: "Manali Adventure Trek",
    destination: "Manali, Himachal Pradesh",
    duration: "5 Days / 4 Nights",
    price: 12999,
    images: ["/manali-mountains.png"],
    description: "Experience the thrill of trekking in the Himalayas",
    inclusions: ["Accommodation", "Meals", "Transport", "Guide"],
    exclusions: ["Personal expenses", "Insurance"],
    availability: 20,
    status: "active",
    category: "Adventure",
  },
  {
    id: "2",
    title: "Goa Beach Paradise",
    destination: "Goa",
    duration: "4 Days / 3 Nights",
    price: 8999,
    images: ["/goa-beach.jpg"],
    description: "Relax on pristine beaches and enjoy water sports",
    inclusions: ["Hotel", "Breakfast", "Airport transfer"],
    exclusions: ["Lunch", "Dinner", "Activities"],
    availability: 15,
    status: "active",
    category: "Beach",
  },
]

export const mockBookings: Booking[] = [
  {
    id: "BK001",
    tripId: "1",
    tripTitle: "Manali Adventure Trek",
    userId: "U001",
    userName: "Rahul Sharma",
    userEmail: "rahul@example.com",
    bookingDate: "2025-03-15",
    travelDate: "2025-04-20",
    status: "confirmed",
    amount: 12999,
    paymentStatus: "paid",
    guests: 2,
  },
  {
    id: "BK002",
    tripId: "2",
    tripTitle: "Goa Beach Paradise",
    userId: "U002",
    userName: "Priya Patel",
    userEmail: "priya@example.com",
    bookingDate: "2025-03-16",
    travelDate: "2025-05-10",
    status: "pending",
    amount: 8999,
    paymentStatus: "pending",
    guests: 1,
  },
]

export const mockCustomers: Customer[] = [
  {
    id: "U001",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "+91 98765 43210",
    joinedDate: "2024-01-15",
    totalBookings: 3,
    totalSpent: 45000,
    status: "active",
  },
  {
    id: "U002",
    name: "Priya Patel",
    email: "priya@example.com",
    phone: "+91 98765 43211",
    joinedDate: "2024-02-20",
    totalBookings: 1,
    totalSpent: 8999,
    status: "active",
  },
]
