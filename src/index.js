import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

// Load environment variables
dotenv.config({
    path: "./.env" // Ensure this path matches the location of your .env file
});

// Connect to the database
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port ${process.env.PORT || 8000}`);
        });

        app.on("error", (error) => {
            console.log(`Error in starting the server: ${error}`);
        });

        console.log("Database connection is successful 😎");
    })
    .catch((err) => {
        console.log("Error in database connection:", err);
    });