/* ESTO SE REPITE SIEMPRE QUE QUIERO CREAR UN NUEVO MODELO DE DOCUMENTO */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const orderSchema = new Schema({

    id: Number,
    store_id: Number,
    billing_name: String,
    shipping_cost_owner: Number,
    shipping_cost_customer: Number,
    subtotal: Number,
    discount: Number,
    total: Number,
    shipping_option: String,
    created_at: Date,
    next_action: String,
    products: Array,
    number: Number,
    owner_note: String,
    cancelled_at: Date,
    closed_at: Date,
    read_at: Date,
    status: String,
    payment_status: String,
    shipping_address: Array,
    shipping_status: String,
    shipped_at: Date,
    paid_at: Date,
    order_picked: Boolean,
    order_packed: Boolean,
    order_picked_for: {
        type: String,
        default: null,
    },
    order_packed_for: {
        type: String,
        default: null,
    },
    order_asigned_to: {
        type: String,
        default: null,
    },
    order_asigned_to_name: {
        type: String,
        default: null,
    },
    order_problem: String,
    order_problem_by: {
        type: String,
        default: null,
    },
    order_controlled: Boolean,
    packed_at: Date,
    picked_at: Date
});

//Crear modelo
const Order = mongoose.model('Order', orderSchema, 'ordenes'); //LE TENGO QUE ESPECIFICAR EL NOMBRE DE LA COLECCION!!!

module.exports = Order;