const { ITEMS_PER_PAGE } = require("../../constants");
const Payment = require("./payment");

module.exports = {
  async createPayment(data) {
    try {
      return await Payment.create(data);
    } catch (err) {
      throw new Error("Error creating payment: " + err.message);
    }
  },
  async getAllPayments(filter, page, userId) {
    try {
      console.log("filter", filter);
      let query = {};
      if (userId) {
        query.userId = userId;
      }
      if (filter.status !== undefined) {
        query.status = filter.status;
      }
      if (filter.type) {
        query.type = filter.type;
      }
      console.log("query", query);
      return await Payment.find(query)
        .populate("userId", "firstName")
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    } catch (err) {
      throw new Error("Error fetching payments: " + err.message);
    }
  },
  async getPaymentById(id) {
    try {
      return await Payment.findById(id);
    } catch (err) {
      throw new Error("Error fetching payment: " + err.message);
    }
  },
  async updatePayment(id, data) {
    try {
      return await Payment.findByIdAndUpdate(id, data, { new: true });
    } catch (err) {
      throw new Error("Error updating payment: " + err.message);
    }
  },
  async deletePayment(id) {
    try {
      return await Payment.findByIdAndDelete(id);
    } catch (err) {
      throw new Error("Error deleting payment: " + err.message);
    }
  },
  async changePaymentStatus(id, status) {
    try {
      const payment = await Payment.findById(id);
      if (!payment) throw new Error("Payment not found");
      payment.status = status;
      return await payment.save();
    } catch (err) {
      throw new Error("Error changing payment status: " + err.message);
    }
  },
};
