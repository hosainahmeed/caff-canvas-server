require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const port = 5000;
console.log(port);

// middleware
app.use(
  cors({
    origin: [
      "https://coffee-rush-15b08.web.app",
      "https://coffee-rush-15b08.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.or0hq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send({ message: "No token provided" });
    }

    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(403).send({ message: "Invalid token" });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(500).send({ message: "Token verification failed", error });
  }
};

async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    const coffeeDataCollection = client.db("coffeeDb").collection("coffee");
    const specialCoffeeCollection = client.db("coffeeDb").collection("special");
    const cartsCoffeeCollection = client.db("coffeeDb").collection("carts");
    const reviewsCoffeeCollection = client.db("coffeeDb").collection("reviews");

    app.get("/", (req, res) => {
      res.send("Coffe shope is open");
    });

    app.post("/jwt", async (req, res) => {
      try {
        const data = req.body;
        const token = jwt.sign(data, process.env.ACCESS_SECRET_TOKEN, {
          expiresIn: "1d",
        });
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
          })
          .status(200)
          .send({ success: true, message: "JWT token issued" });
      } catch (error) {
        res.status(500).send({ message: "Error generating token", error });
      }
    });

    app.get("/coffee", async (req, res) => {
      try {
        const result = await coffeeDataCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching coffee data:", error);
        res.status(500).send("An error occurred while fetching coffee data");
      }
    });

    app.post("/coffee", async (req, res) => {
      const data = req.body;
      const result = await coffeeDataCollection.insertOne(data);
      res.send(result);
    });

    app.delete("/coffee/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coffeeDataCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/coffee/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const options = { upsert: true };
      const filter = { _id: new ObjectId(id) };
      const updateCoffee = {
        $set: {
          Category: data.Category,
          Chef: data.Chef,
          Details: data.Details,
          Name: data.Name,
          Photo: data.Photo,
          Supplier: data.Supplier,
          Taste: data.Taste,
          Price: data.Price,
        },
      };

      const result = await coffeeDataCollection.updateOne(
        filter,
        updateCoffee,
        options
      );
      res.send(result);
    });

    app.get("/special", async (req, res) => {
      try {
        const result = await specialCoffeeCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error({ message: error.message });
      }
    });

    // reviews

    app.get("/reviews", async (req, res) => {
      try {
        const result = await reviewsCoffeeCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });
    app.get("/carts/:userId", async (req, res) => {
      try {
        const userId =req.params.userId
        const result = await cartsCoffeeCollection.find({userId}).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "An error occurred while retrieving carts." });
      }
    });
    
    
    app.post("/carts", async (req, res) => {
      try {
        const data = req.body;

        const result = await cartsCoffeeCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        console.error({ message: error.message });
      }
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = cartsCoffeeCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/menu", async (req, res) => {
      try {
        const data = req.body;
        const result = await coffeeDataCollection.find().toArray(data);
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
