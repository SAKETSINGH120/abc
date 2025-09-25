// const axios = require("axios");

// class CoinGeckoService {
//   constructor() {
//     this.baseURL = "https://api.coingecko.com/api/v3";
//     this.cachedData = null;
//     this.intervalId = null;
//     this.lastUpdate = null;
//   }

//   async getTopCryptos() {
//     try {
//       const response = await axios.get(`${this.baseURL}/coins/markets`, {
//         params: {
//           vs_currency: "usd",
//           order: "market_cap_desc",
//           per_page: 10,
//           page: 1,
//           sparkline: false,
//         },
//       });
//       return response.data;
//     } catch (error) {
//       throw new Error(`CoinGecko API error: ${error.message}`);
//     }
//   }
// }

const axios = require("axios");

class CoinGeckoService {
  constructor() {
    this.baseURL = "https://api.coingecko.com/api/v3";
    this.cachedData = null;
    this.intervalId = null;
    this.lastUpdate = null;
  }

  async getTopCryptos(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/coins/markets`, {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 10,
          page: page,
          sparkline: false,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`CoinGecko API error: ${error.message}`);
    }
  }

  // 🔥 Start polling every 30s
  startAutoUpdate(interval = 30000) {
    if (this.intervalId) return; // prevent multiple intervals

    const fetchAndCache = async () => {
      try {
        const data = await this.getTopCryptos();
        this.cachedData = data;
        this.lastUpdate = new Date();
        console.log("✅ Crypto data updated at", this.lastUpdate.toISOString());
      } catch (err) {
        console.error("❌ Failed to update crypto data:", err.message);
      }
    };

    // run immediately + then every 30s
    fetchAndCache();
    this.intervalId = setInterval(fetchAndCache, interval);
  }

  // 🔹 Stop polling
  stopAutoUpdate() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // 🔹 Get cached data instead of hitting API every time
  getCachedData() {
    return {
      data: this.cachedData,
      lastUpdate: this.lastUpdate,
    };
  }

  // 🔹 Get data for any page
  async getDataByPage(page = 1) {
    const data = await this.getTopCryptos(page);
    return {
      data: data,
      lastUpdate: new Date(),
    };
  }
}

module.exports = new CoinGeckoService();
