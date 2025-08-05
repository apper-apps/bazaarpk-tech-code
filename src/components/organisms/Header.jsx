import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import SearchBar from "@/components/molecules/SearchBar";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/utils/cn";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const totalItems = getTotalItems();

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
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center">
                <ApperIcon name="ShoppingBag" className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-primary-800">
                BazaarPK
              </span>
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <SearchBar
                placeholder="Search for products..."
                onSearch={handleSearch}
                suggestions={searchSuggestions}
                className="w-full"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/category"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Categories
              </Link>
              <Link
                to="/deals"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Deals
              </Link>
              
              {/* Cart Button */}
              <Button
                variant="ghost"
                onClick={() => navigate("/cart")}
                className="relative p-2"
              >
                <ApperIcon name="ShoppingCart" className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" className="relative p-2">
                <ApperIcon name="Bell" className="w-6 h-6" />
                <span className="absolute top-1 right-1 bg-accent-500 w-2 h-2 rounded-full"></span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/cart")}
                className="relative p-2"
              >
                <ApperIcon name="ShoppingCart" className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                <ApperIcon name={isMobileMenuOpen ? "X" : "Menu"} className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4">
            <SearchBar
              placeholder="Search products..."
              onSearch={handleSearch}
              suggestions={searchSuggestions}
              className="w-full"
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
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-lg font-display font-semibold text-gray-900">Menu</span>
            <Button
              variant="ghost"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              <ApperIcon name="X" className="w-6 h-6" />
            </Button>
          </div>

          {/* Mobile Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-4">
            <Link
              to="/category"
              onClick={toggleMobileMenu}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors duration-200"
            >
              <ApperIcon name="Grid3X3" className="w-5 h-5 text-primary-600" />
              <span className="text-gray-700 font-medium">Categories</span>
            </Link>
            
            <Link
              to="/deals"
              onClick={toggleMobileMenu}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors duration-200"
            >
              <ApperIcon name="Percent" className="w-5 h-5 text-accent-600" />
              <span className="text-gray-700 font-medium">Deals</span>
            </Link>

            <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors duration-200 w-full">
              <ApperIcon name="Bell" className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-medium">Notifications</span>
              <span className="ml-auto bg-accent-500 text-white text-xs rounded-full px-2 py-1">3</span>
            </button>

            <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors duration-200 w-full">
              <ApperIcon name="MessageCircle" className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium">WhatsApp Support</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;