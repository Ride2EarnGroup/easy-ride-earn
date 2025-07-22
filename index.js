import connectDB from "./db/index.js";

import {app} from './app.js'

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR to connect server:",error);
            throw error;
    })
    app.listen(process.env.PORT||8000,()=>{
        console.log(`the server is running at ${process.env.PORT}`);
    })
})

.catch((err)=>{
    console.log("MONGODB CONNECTION FAILED !!! ",err);
})













