const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const app = express()
const port = process.env.PORT || 5000;

//middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qzuhl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('perfectPottery')
        const productsCollection = database.collection('products')
        const ordersCollection = database.collection('orders')
        const usersCollection = database.collection('users')
        const reviewsCollection = database.collection('reviews')

        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({})
            const result = await cursor.toArray();
            res.json(result);
        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const result = await productsCollection.findOne({ _id: ObjectId(id) });
            res.json(result);
        })
        //place order
        app.post('/placeOrder', async (req, res) => {
            const result = await ordersCollection.insertOne(req.body);
            console.log(result)
            res.json(result);
        })

        //get single order
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const result = await ordersCollection.findOne({ _id: ObjectId(id) });
            res.json(result);
            console.log(req.body)
        })

        //delete single orders
        app.delete("/deleteOrder/:id", async (req, res) => {
            console.log(req.params);
            const result = await ordersCollection.deleteOne({
                _id: ObjectId(req.params.id),
            });
            res.json(result);
        });

        //get my orders
        app.get('/myOrders', async (req, res) => {
            const result = await ordersCollection.find({ email: { $regex: req.query.email }, }).toArray();
            res.json(result);
            console.log(result);
        })

        //get admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role) {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        //save user by email/password 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.json(result)
        })

        //save user by google login
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email }
            const options = { upsert: true }
            const updateDoc = { $set: user }
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })

        //set user as an admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email }
            const updateDoc = { $set: { role: 'admin' } }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.json(result)
        })

        //post single review
        app.post('/giveReview', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review)
            res.json(result)
        })

        //get all reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find({}).toArray();
            res.json(result)
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Perfect Pottery is Here!')
})

app.listen(port, () => {
    console.log(`Perfect Pottery running at http://localhost:${port}`)
})