import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { RestaurantAuthProvider } from './contexts/RestaurantAuthContext';

// Critical path - loaded immediately (customer landing)
import CustomerDashboard from './pages/CustomerDashboard';

// Lazy-loaded routes - only fetched when navigated to
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ManagePartners = lazy(() => import('./pages/ManagePartners'));
const ManageCoupons = lazy(() => import('./pages/ManageCoupons'));
const ManageRestaurants = lazy(() => import('./pages/ManageRestaurants'));
const ManageMenuItems = lazy(() => import('./pages/ManageMenuItems'));
const RestaurantMenuPage = lazy(() => import('./pages/RestaurantMenuPage'));
const CustomerLogin = lazy(() => import('./pages/CustomerLogin'));
const CustomerRegister = lazy(() => import('./pages/CustomerRegister'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const UpdateProfile = lazy(() => import('./pages/UpdateProfile'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const PartnerLogin = lazy(() => import('./pages/PartnerLogin'));
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'));
const RestaurantLogin = lazy(() => import('./pages/RestaurantLogin'));
const RestaurantPortalDashboard = lazy(() => import('./pages/RestaurantPortalDashboard'));
const OrdersManagement = lazy(() => import('./pages/OrdersManagement'));
const CustomerOrders = lazy(() => import('./pages/CustomerOrders'));
const DebugAuth = lazy(() => import('./pages/DebugAuth'));
const ViewAllPage = lazy(() => import('./pages/ViewAllPage'));
const FAQsPage = lazy(() => import('./pages/FAQsPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const HelpAndSupportPage = lazy(() => import('./pages/HelpAndSupportPage'));
const FastFoodsPage = lazy(() => import('./pages/FastFoodsPage'));
const TravelPage = lazy(() => import('./pages/TravelPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));


// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-3"></div>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/customer/dashboard" />} />
          <Route path="/debug" element={<DebugAuth />} />
          
          {/* Admin Routes */}
          <Route path="/sys-x9k3m-auth" element={<AdminLogin />} />
          <Route path="/sys-v4h8n-panel" element={<AdminDashboard />} />
          <Route path="/sys-r7b3c-partners" element={<ManagePartners />} />
          <Route path="/sys-c8l2d-coupons" element={<ManageCoupons />} />
          <Route path="/sys-o3z7p-orders" element={<OrdersManagement userRole="admin" />} />
          <Route path="/sys-m5r9t-restaurants" element={<ManageRestaurants />} />
          <Route path="/sys-menu/:restaurantId" element={<ManageMenuItems />} />
          <Route path="/restaurant/:restaurantId" element={<RestaurantMenuPage />} />
          
          {/* Customer Routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/edit-profile" element={<EditProfile />} />
          <Route path="/customer/update-profile" element={<UpdateProfile />} />
          <Route path="/customer/search" element={<SearchPage />} />
          <Route path="/customer/wishlist" element={<WishlistPage />} />
          <Route path="/customer/cart" element={<CartPage />} />
          <Route path="/customer/orders" element={<CustomerOrders />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/product/:type/:id" element={<ProductDetailPage />} />
          <Route path="/view-all" element={<ViewAllPage />} />
          <Route path="/faqs" element={<FAQsPage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/help-and-support" element={<HelpAndSupportPage />} />
          <Route path="/fastfoods" element={<FastFoodsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/travel" element={<TravelPage />} />
          
          {/* Partner Routes */}
          <Route path="/dlv-q5n8t-auth" element={<PartnerLogin />} />
          <Route path="/dlv-w2r6e-panel" element={<PartnerDashboard />} />
          <Route path="/dlv-j9m1a-orders" element={<OrdersManagement userRole="partner" />} />

          {/* Restaurant Portal Routes */}
          <Route path="/restaurant-portal/login" element={
            <RestaurantAuthProvider>
              <RestaurantLogin />
            </RestaurantAuthProvider>
          } />
          <Route path="/restaurant-portal/*" element={
            <RestaurantAuthProvider>
              <RestaurantPortalDashboard />
            </RestaurantAuthProvider>
          } />
        </Routes>
        </Suspense>
      </div>
      <Analytics />
    </Router>
  );
}

export default App;