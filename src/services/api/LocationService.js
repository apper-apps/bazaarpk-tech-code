class LocationService {
static async getUserLocation() {
    try {
      if (!navigator.geolocation) {
        return { 
          city: "Pakistan", 
          country: "Pakistan", 
          weather: "moderate",
          temperature: 25 
        };
      }

      const position = await new Promise((resolve, reject) => {
        const options = {
          enableHighAccuracy: true,
          timeout: 10000, // 10 second timeout
          maximumAge: 300000 // 5 minutes cache
        };
        
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
      
      const { latitude, longitude } = position.coords;
      
      // Get location data based on coordinates
      const locationData = await this.getLocationData(latitude, longitude);
      
      return locationData;
    } catch (error) {
      console.info("Geolocation unavailable, using default location:", error.message);
      
      const errorCode = error?.code || 0;
      let errorDescription = "Unknown geolocation error";
      
      // Handle specific error codes gracefully
      switch(errorCode) {
        case 1: // PERMISSION_DENIED
          errorDescription = "Location access denied";
          break;
        case 2: // POSITION_UNAVAILABLE
          errorDescription = "Location unavailable";
          break;
        case 3: // TIMEOUT
          errorDescription = "Location request timeout";
          break;
        default:
          errorDescription = "Geolocation service unavailable";
      }

      // Simplified logging - only show in development mode
      if (import.meta.env.DEV) {
        console.info(`Geolocation fallback active: ${errorDescription} (Code: ${errorCode})`);
      }
      
      // Return graceful fallback with minimal error details
      return { 
        city: "Pakistan", 
        country: "Pakistan", 
        weather: "moderate",
        temperature: 25,
        error: {
          code: errorCode,
          message: errorDescription,
          handled: true
        }
      };
    }
  }

  static getLocationErrorReason(errorCode) {
    switch (errorCode) {
      case 1: // PERMISSION_DENIED
        return "Location access denied by user";
      case 2: // POSITION_UNAVAILABLE
        return "Location information unavailable";
      case 3: // TIMEOUT
        return "Location request timed out";
      default:
        return "Location service unavailable";
    }
  }

  static async getLocationData(latitude, longitude) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data - in real app would call geocoding and weather APIs
    const locations = [
      {
        lat: { min: 24.8, max: 25.4 }, lng: { min: 66.9, max: 67.2 },
        city: "Karachi", country: "Pakistan", weather: "hot", temperature: 35
      },
      {
        lat: { min: 31.4, max: 31.6 }, lng: { min: 74.2, max: 74.4 },
        city: "Lahore", country: "Pakistan", weather: "warm", temperature: 30
      },
      {
        lat: { min: 33.6, max: 33.7 }, lng: { min: 73.0, max: 73.1 },
        city: "Islamabad", country: "Pakistan", weather: "cool", temperature: 22
      },
      {
        lat: { min: 31.4, max: 31.5 }, lng: { min: 71.5, max: 71.6 },
        city: "Multan", country: "Pakistan", weather: "hot", temperature: 38
      },
      {
        lat: { min: 34.0, max: 34.2 }, lng: { min: 71.5, max: 71.6 },
        city: "Peshawar", country: "Pakistan", weather: "moderate", temperature: 25
      }
    ];

    const location = locations.find(loc => 
      latitude >= loc.lat.min && latitude <= loc.lat.max &&
      longitude >= loc.lng.min && longitude <= loc.lng.max
    );

    return location || { 
      city: "Pakistan", 
      country: "Pakistan", 
      weather: "moderate", 
      temperature: 25 
    };
  }

  static getWeatherBasedCategories(weather, temperature) {
    const categories = {
      hot: ["diet", "fruits", "vegetables", "electronics"], // Cold drinks, fresh items
      warm: ["foods", "groceries", "fruits", "cosmetics"],
      moderate: ["groceries", "foods", "electronics", "garments"],
      cool: ["foods", "health", "garments", "household items"], // Warm foods, heating
      cold: ["foods", "electric", "garments", "health"] // Heaters, warm clothing
    };

    return categories[weather] || categories.moderate;
  }

  static getSeasonalProducts(weather) {
    const seasonal = {
      hot: ["Diet Green Tea", "Fresh Mixed Fruits", "Cooking Oil", "Face Wash"],
      warm: ["Fresh Mixed Fruits", "Diet Green Tea", "Biryani Masala", "Cotton Bed Sheets"],
      moderate: ["Premium Basmati Rice", "Natural Honey", "Fresh Organic Tomatoes"],
      cool: ["Biryani Masala", "Traditional Pakistani Sweets", "Electric Heater"],
      cold: ["Electric Heater", "Traditional Pakistani Sweets", "Pure Desi Ghee", "Natural Honey"]
    };

    return seasonal[weather] || seasonal.moderate;
  }

  static getLocationMessage(location) {
    const messages = {
      hot: `🌡️ Trending in ${location.city} - Beat the heat!`,
      warm: `☀️ Popular in ${location.city} - Stay fresh!`,
      moderate: `🌟 Trending in ${location.city}`,
      cool: `🍂 Perfect for ${location.city} weather`,
      cold: `❄️ Winter favorites in ${location.city}`
    };

    return messages[location.weather] || `🌟 Trending in ${location.city}`;
  }
}

export { LocationService };