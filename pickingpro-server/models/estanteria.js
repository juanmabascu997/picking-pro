const mongoose = await import('mongoose');
const Schema = mongoose.Schema;

const estanteriaSchema = new Schema({
    nombre: {
        type: String,
        unique: true,
    },
    capacidad: Number,
    created_by: String,
});

const Estanteria = mongoose.model('Estanteria', estanteriaSchema, 'estanterias');

module.exports = Estanteria;