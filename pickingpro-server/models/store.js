/* ESTO SE REPITE SIEMPRE QUE QUIERO CREAR UN NUEVO MODELO DE DOCUMENTO */

const mongoose = require ('mongoose');
const Schema = mongoose.Schema;

const storeSchema = new Schema({
    nombre: String,
    user_id: Number,
    access_token: String
});

//Crear modelo
const Store = mongoose.model('Store', storeSchema, 'stores'); //LE TENGO QUE ESPECIFICAR EL NOMBRE DE LA COLECCION!!!

module.exports = Store;