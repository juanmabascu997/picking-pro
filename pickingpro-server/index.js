const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* --- CONFIGURACION DE BASE DE DATOS --- */
// const user = 'user_order';            //Configuro usuario
// const password = 'OyxrdEG10q5QW5Km';        //Configuro contraseña
// const uri = `mongodb+srv://${user}:${password}@cluster0.pe8iyp6.mongodb.net/picking-pro?retryWrites=true&w=majority`;             //Configuro uri

const uri = `mongodb://mongo:uRh3w0zN7QWo2nnuxPMC@containers-us-west-155.railway.app:7988`;

mongoose.connect(uri,
    { useNewUrlParser: true, useUnifiedTopology: true }
)           //Nos conectamos a la dirección de la base
    .then(() => console.log("Base de datos conectada"))
    .catch(e => console.log(e))

app.use(cors({
    //origin: ["https://pickingprocli.herokuapp.com", "http://localhost:3000"],
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
}));

app.use(express.json());
app.use('/api', require('./routes/integrationRoutes'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/data', require('./routes/dataRoutes'));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log("Server listening on port " + PORT);
})