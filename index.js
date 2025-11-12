// Import modules
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ujhkgt.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
  try {
    await client.connect();
    const homeNestDB = client.db("homeNestDB");
    const propertiesCollection = homeNestDB.collection("properties");
    const myRatingCollection = homeNestDB.collection("myRating");

    console.log("✅ Connected to MongoDB");

    // ------------------- PROPERTIES ----

    // Get all properties
    app.get("/allProperties", async (req, res) => {
      const result = await propertiesCollection.find().toArray();
      res.send(result);
    });

    // Get single property by ID
    app.get("/allProperties/:id", async (req, res) => {
      const id = req.params.id;
      const property = await propertiesCollection.findOne({ _id: new ObjectId(id) });
      res.send(property);
    });

    // Add new property
    app.post("/allProperties", async (req, res) => {
      const property = req.body;
      if (!property.propertyName || !property.userEmail) {
        return res.status(400).send({ message: "Missing required fields" });
      }
      const result = await propertiesCollection.insertOne(property);
      res.send(result);
    });

    // Update property
    app.put("/allProperties/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await propertiesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // Delete property
    app.delete("/myProperties/:id", async (req, res) => {
      const id = req.params.id;
      const result = await propertiesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Get properties of logged-in user
    app.get("/myProperties", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ message: "Email is required" });

        const userProperties = await propertiesCollection.find({ userEmail: email }).toArray();
        res.send(userProperties);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // ------------------- RATINGS -------------------

    // Add rating (one-time per user per property)
    app.post("/myRating", async (req, res) => {
      try {
        const { propertyId, name, description, image, rating, reviewText, email } = req.body;
        if (!propertyId || !email) return res.status(400).send({ message: "Invalid data" });

        // Check if user already rated this property
        const existingRating = await myRatingCollection.findOne({
          propertyId,
          email,
        });

        if (existingRating) {
          return res.status(400).send({
            message: "You have already submitted a rating for this property.",
          });
        }

        // Insert rating
        const ratingResult = await myRatingCollection.insertOne({
          propertyId,
          propertyName: name,
          description,
          image,
          rating,
          reviewText,
          email,
          date: new Date(),
        });

        res.send({ insertedId: ratingResult.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // Get all ratings of a user
    app.get("/myRating", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ message: "Email is required" });

        const userRatings = await myRatingCollection.find({ email }).toArray();
        res.send(userRatings);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // ------------------- ROOT -------------------
    app.get("/", (req, res) => {
      res.send("🏡 HomeNest Server Running!");
    });

  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

// Start server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
