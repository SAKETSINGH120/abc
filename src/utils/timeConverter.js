const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// 🔹 Hamesha IST timezone ke saath kaam karega
const TIMEZONE = "Asia/Kolkata";

module.exports = {
  // Abhi ka IST time
  nowIST: () => {
    return dayjs().tz(TIMEZONE).toDate();
  },

  // Kisi bhi date ko IST me convert karo
  toIST: (date) => {
    return dayjs(date).tz(TIMEZONE).toDate();
  },

  // String ISO me chahiye (for logs/debugging)
  formatIST: (date) => {
    return dayjs(date).tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
  },
};
