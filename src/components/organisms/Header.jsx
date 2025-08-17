import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import SearchBar from "@/components/molecules/SearchBar";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/utils/cn";
const Header = () => {
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const totalItems = getTotalItems();
  const [previousItemCount, setPreviousItemCount] = useState(0);

  // Trigger cart animation when items change
  useEffect(() => {
    if (totalItems !== previousItemCount && totalItems > 0) {
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
    }
    setPreviousItemCount(totalItems);
  }, [totalItems, previousItemCount]);

  const searchSuggestions = [
    "Fresh Vegetables",
    "Organic Fruits", 
    "Basmati Rice",
    "Desi Ghee",
    "Halal Meat",
    "Beauty Products",
    "Mobile Phones",
    "Electronics"
  ];

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/category?search=${encodeURIComponent(query)}`);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

return (
<>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-soft enhanced-typography" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg enhanced-spacing"
              aria-label="BazaarPK Home"
className="word-spacing-relaxed"
            >
              <ApperIcon name="Store" className="w-8 h-8 text-white" />
              <span 
                className="text-2xl font-bold text-white font-display word-spacing-relaxed"
                role="img">
                BazaarPK
              </span>
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8" role="search">
              <SearchBar
                placeholder="Search for products..."
                onSearch={handleSearch}
                suggestions={searchSuggestions}
                className="w-full"
                aria-label="Product search"
              />
            </div>

            {/* Desktop Navigation */}
<nav className="hidden md:flex items-center space-x-4 enhanced-typography" role="navigation" aria-label="Main navigation">
              <Link
                to="/category"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 enhanced-spacing"
                aria-label="Browse product categories"
                style={{ wordSpacing: '0.06em', letterSpacing: '0.015em' }}
              >
                Categories
              </Link>
              <Link
                to="/deals"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 enhanced-spacing"
                aria-label="View current deals and offers"
                style={{ wordSpacing: '0.06em', letterSpacing: '0.015em' }}
              >
                Deals
              </Link>
              {/* Cart Button */}
<Button
                variant="ghost"
                onClick={() => navigate("/cart")}
                className={cn(
                  "relative p-2 transition-all duration-300",
                  cartPulse && "animate-pulse scale-110"
                )}
                aria-label={totalItems > 0 ? `Shopping cart with ${totalItems} items` : 'Shopping cart (empty)'}
                title={totalItems > 0 ? `${totalItems} items in cart` : 'Shopping cart is empty'}
              >
                <ApperIcon name="ShoppingCart" className="w-6 h-6" aria-hidden="true" />
                {totalItems > 0 && (
                  <span 
                    className={cn(
                      "absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium transition-all duration-300",
                      cartPulse && "animate-bounce bg-green-500"
                    )}
                    aria-label={`${totalItems} items`}
                    role="status"
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Button>

              {/* Notifications */}
              <Button 
                variant="ghost" 
                className="relative p-2"
                aria-label="View notifications"
                title="You have new notifications"
              >
                <ApperIcon name="Bell" className="w-6 h-6" aria-hidden="true" />
                <span 
                  className="absolute top-1 right-1 bg-accent-500 w-2 h-2 rounded-full"
                  aria-label="New notifications available"
                  role="status"
                ></span>
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
<Button
                variant="ghost"
                onClick={() => navigate("/cart")}
                className={cn(
                  "relative p-2 transition-all duration-300",
                  cartPulse && "animate-pulse scale-110"
                )}
                aria-label={totalItems > 0 ? `Shopping cart with ${totalItems} items` : 'Shopping cart (empty)'}
                title={totalItems > 0 ? `${totalItems} items in cart` : 'Shopping cart is empty'}
              >
                <ApperIcon name="ShoppingCart" className="w-6 h-6" aria-hidden="true" />
                {totalItems > 0 && (
                  <span 
                    className={cn(
                      "absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium transition-all duration-300",
                      cartPulse && "animate-bounce bg-green-500"
                    )}
                    aria-label={`${totalItems} items`}
                    role="status"
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={toggleMobileMenu}
                className="p-2"
                aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                title={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <ApperIcon 
                  name={isMobileMenuOpen ? "X" : "Menu"} 
                  className="w-6 h-6" 
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4" role="search">
            <SearchBar
              placeholder="Search products..."
              onSearch={handleSearch}
              suggestions={searchSuggestions}
              className="w-full"
              aria-label="Product search"
            />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

{/* Mobile Menu Drawer */}
      <div 
        id="mobile-menu"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal={isMobileMenuOpen}
        aria-labelledby="mobile-menu-title"
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Focus trap and overlay for accessibility */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 md:hidden"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />
        )}
        
        <div className="relative flex flex-col h-full bg-white">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 id="mobile-menu-title" className="text-lg font-display font-semibold text-gray-900">
              Menu
            </h2>
            <Button
              variant="ghost"
              onClick={toggleMobileMenu}
              className="p-2"
              aria-label="Close mobile menu"
            >
              <ApperIcon name="X" className="w-6 h-6" aria-hidden="true" />
            </Button>
          </div>

          {/* Mobile Menu Items */}
          <nav 
            className="flex-1 px-4 py-6 space-y-4" 
            role="navigation" 
            aria-label="Mobile navigation"
          >
<Link
              to="/category"
              onClick={toggleMobileMenu}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 focus:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 enhanced-spacing"
              aria-label="Browse product categories"
className="word-spacing-relaxed"
            >
              <ApperIcon name="Grid3x3" className="w-5 h-5" />
              <span className="text-gray-700 font-medium word-spacing-relaxed">Categories</span>
            </Link>
            
            <Link
              to="/deals"
              onClick={toggleMobileMenu}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 focus:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 enhanced-spacing"
              aria-label="View current deals and offers"
className="word-spacing-relaxed"
            >
              <ApperIcon name="Tag" className="w-5 h-5" />
              <span className="text-gray-700 font-medium word-spacing-relaxed">Deals</span>
            </Link>

            <button 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 focus:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 w-full text-left"
              aria-label="View notifications (3 new notifications)"
              onClick={() => {
                toggleMobileMenu();
                // Handle notifications action
              }}
            >
              <ApperIcon name="Bell" className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <span className="text-gray-700 font-medium">Notifications</span>
              <span 
                className="ml-auto bg-accent-500 text-white text-xs rounded-full px-2 py-1"
                aria-label="3 new notifications"
                role="status"
              >
                3
              </span>
            </button>

            <button 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 focus:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 w-full text-left"
              aria-label="Contact WhatsApp support"
              onClick={() => {
                toggleMobileMenu();
                window.open('https://wa.me/your-whatsapp-number', '_blank');
              }}
            >
              <ApperIcon name="MessageCircle" className="w-5 h-5 text-green-600" aria-hidden="true" />
              <span className="text-gray-700 font-medium">WhatsApp Support</span>
            </button>

            {/* Accessibility Settings Button */}
            <button 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 focus:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 w-full text-left"
              aria-label="Accessibility settings"
              onClick={() => {
                // Toggle high contrast mode or other accessibility features
                document.body.classList.toggle('high-contrast-mode');
                toggleMobileMenu();
              }}
            >
              <ApperIcon name="Eye" className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span className="text-gray-700 font-medium">Accessibility</span>
            </button>
          </nav>

          {/* Mobile menu footer with keyboard instructions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Use Tab to navigate, Enter to select
            </p>
          </div>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isMobileMenuOpen && "Mobile menu opened"}
        {!isMobileMenuOpen && "Mobile menu closed"}
      </div>
    </>
  );
};

export default Header;