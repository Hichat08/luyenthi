import mongoose from "mongoose";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async (maxRetries = 5, retryDelayMs = 5000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      // @ts-ignore
      await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("Liên kết CSDL thành công!");
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `Lỗi khi kết nối CSDL lần ${attempt}/${maxRetries}:`,
        error.message
      );

      if (attempt < maxRetries) {
        await wait(retryDelayMs);
      }
    }
  }

  throw lastError;
};
