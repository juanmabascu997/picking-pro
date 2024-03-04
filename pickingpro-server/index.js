const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const uri = `mongodb://mongo:b-eaEch4-62-3eh3Bf5-3G2Dd52Abgac@monorail.proxy.rlwy.net:23081`;
 
mongoose.connect(uri,
    { useNewUrlParser: true, useUnifiedTopology: true }
)           //Nos conectamos a la dirección de la base
    .then(() => console.log("Base de datos conectada"))
    .catch(e => console.log(e))
    
mongoose.set('strictQuery', false);

app.use(cors({
    origin: ["https://picking-pro-production.up.railway.app", "http://localhost:3000", "https://pickingpro-front-v2.vercel.app"],
    // origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
}));

app.use(express.json());
app.use('/api', require('./routes/integrationRoutes'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/data', require('./routes/dataRoutes'));
app.use('/info', require('./routes/infoRoutes'));
app.use('/picking', require('./routes/pickingRoutes'));
app.use('/estanteria', require('./routes/estanteriaRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.use('/test', require('./routes/testRoutes'));

// var Agenda = require('agenda');


// const { getTransactionsDataWorker } = require("./controllers/worker");


// var agenda = new Agenda({db: {address: uri}});

// agenda.define('sendNewsletter', function() {
//   console.log("Sending newsletter.");
//   getTransactionsDataWorker();
// });

// agenda.on('ready', function() {
//   agenda.every('24 hours', 'sendNewsletter');
//   agenda.start(); 
// });


// ------------------------------
// QUERYS_MONGO
// resetGoals(User)

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log("Server listening on port " + PORT);
})