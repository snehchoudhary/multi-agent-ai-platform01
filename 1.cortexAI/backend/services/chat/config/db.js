import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Chat DB connected successfully");
    } catch (error) {
        console.error("Chat DB connection failed:", error.message);
        throw error;
    }
};

export default connectDb;