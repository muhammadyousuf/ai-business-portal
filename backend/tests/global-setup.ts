import mongoose from "mongoose";
export default async function setup() {
  process.env.NODE_ENV = "test";
  const uri = process.env.MONGODB_TEST_URI ?? "mongodb://127.0.0.1:27017/ai-business-portal-test";
  await mongoose.connect(uri);
  await mongoose.connection.db!.dropDatabase();
  await mongoose.disconnect();
}
