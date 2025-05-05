require('dotenv').config();
const neo4j = require('neo4j-driver');
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');

const app = express();

const neo4jUri = process.env.NEO4J_URI;
const neo4jUser = process.env.NEO4J_USER;
const neo4jPassword = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));

//CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); //Not secure, just for testing!
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  const session = driver.session();
  req.neo4jSession = session;
  next();
});

//Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let dbName;
async function connectToMongoDB() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    dbName = "Hospital-Management-System";
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.log(error);
  }
}

connectToMongoDB();

// Get all patients
app.get('/patients', async (req, res) => {
  try {
    // Get a reference to the "Patients" collection
    const collection = client.db(dbName).collection("Patients");

    // Retrieve all documents from the "Patients" collection
    const result = await collection.find({}).toArray();

    // Return the retrieved documents as a JSON response
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal server error');
  }
});

//Get patient data by room number
app.get('/patients/:roomNumber', async (req, res) => {
  const roomNumber = req.params.roomNumber;
  const patients = client.db(dbName).collection('Patients');
  try {
    const result = await patients.findOne({ currentRoomNumber: roomNumber });
    if (!result) {
      res.status(404).send('Patient not found');
      return;
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});


//GET Complete Neo4j Database
app.get('/all', (req, res) => {
  const session = req.neo4jSession;
  session.run('MATCH (n) RETURN n')
    .then(result => {
      //console.log(result);
      const records = result.records.map(record => record.get(0));
      session.close();
      res.json(records);
    })
    .catch(error => {
      session.close();
      console.log(error);
      res.status(500).send('Internal server error');
    });
});

//GET the shortest path between two nodes by their ID
app.get('/shortestPathByID', (req, res) => {
  const session = req.neo4jSession;
  const node1 = parseInt(req.query.node1); // Parse node1 value from query parameter
  const node2 = parseInt(req.query.node2); // Parse node2 value from query parameter

  session.run('MATCH (node1), (node2) WHERE id(node1) = $node1 AND id(node2) = $node2 ' +
              'MATCH p=allShortestPaths((node1)-[*]-(node2)) ' +
              'RETURN nodes(p) AS nodes, reduce(cost=0, r in relationships(p) | cost+r.time_penalty) AS total_penalty ' +
              'ORDER BY total_penalty LIMIT 1', { node1, node2 })
    .then(result => {
      const nodes = result.records[0].get("nodes");
      res.json(nodes);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Internal server error');
    });
});

//GET the shortest path between two nodes by their Name
app.get('/shortestPathByName', (req, res) => {
  const session = req.neo4jSession;
  const node1Name = req.query.node1;
  const node2Name = req.query.node2;

  session.run('MATCH (node1 {name: $node1Name}), (node2 {name: $node2Name}) ' +
              'MATCH p=allShortestPaths((node1)-[*]-(node2)) ' +
              'RETURN nodes(p) AS nodes, reduce(cost=0, r in relationships(p) | cost+r.time_penalty) AS total_penalty ' +
              'ORDER BY total_penalty LIMIT 1', { node1Name, node2Name })
    .then(result => {
      const nodes = result.records[0].get("nodes");
      res.json(nodes);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Internal server error');
    });
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});