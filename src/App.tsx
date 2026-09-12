import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AuthModal, CompareTray, Footer, Header, MobileBottomNav } from "./components/layout";
import { ToastHost } from "./components/ui";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Search from "./pages/Search";
import ListingDetail from "./pages/ListingDetail";
import { BookingRequest, Checkout, Confirmation } from "./pages/Booking";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import { RenterDashboard, ReviewsPage } from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import { HostEarnings, HostGuard, HostInsights, HostListings, HostOverview, HostRequests } from "./pages/Host";
import HostCalendar from "./pages/HostCalendar";
import CreateListing from "./pages/CreateListing";
import { Account, Help, HostProfile, NotFound, PolicyPage } from "./pages/Misc";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-brass focus:text-ink focus:px-4 focus:py-2 focus:rounded-lg focus:top-2 focus:left-2">
        Skip to content
      </a>
      <ScrollToTop />
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<Landing />} />
          <Route path="/search" element={<Search />} />
          <Route path="/space/:id" element={<ListingDetail />} />
          <Route path="/space/:id/book" element={<BookingRequest />} />
          <Route path="/checkout/:bookingId" element={<Checkout />} />
          <Route path="/confirmation/:bookingId" element={<Confirmation />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/dashboard" element={<RenterDashboard />} />
          <Route path="/dashboard/bookings" element={<RenterDashboard />} />
          <Route path="/dashboard/reviews" element={<ReviewsPage />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:threadId" element={<Inbox />} />
          <Route path="/host" element={<HostGuard><HostOverview /></HostGuard>} />
          <Route path="/host/listings" element={<HostGuard><HostListings /></HostGuard>} />
          <Route path="/host/listings/new" element={<CreateListing />} />
          <Route path="/host/listings/:id/edit" element={<CreateListing />} />
          <Route path="/host/calendar" element={<HostGuard><HostCalendar /></HostGuard>} />
          <Route path="/host/requests" element={<HostGuard><HostRequests /></HostGuard>} />
          <Route path="/host/earnings" element={<HostGuard><HostEarnings /></HostGuard>} />
          <Route path="/host/insights" element={<HostGuard><HostInsights /></HostGuard>} />
          <Route path="/profile/:hostId" element={<HostProfile />} />
          <Route path="/account" element={<Account />} />
          <Route path="/help" element={<Help />} />
          <Route path="/terms" element={<PolicyPage kind="terms" />} />
          <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
          <Route path="/policies/cancellation" element={<PolicyPage kind="cancellation" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <MobileBottomNav />
      <CompareTray />
      <AuthModal />
      <ToastHost />
    </div>
  );
}
