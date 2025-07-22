import mongoose from "mongoose";

const connectDB= async()=>{
try {
const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/rideApp`)
 console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
}

 catch (error) {
    console.error("mongoDb connection error",error);
     process.exit(1)
}
}
export default connectDB
