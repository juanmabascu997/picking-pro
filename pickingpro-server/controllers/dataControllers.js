const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");
const jwt = require("jsonwebtoken");

module.exports.getDashboardData = async (req, res) => {
    /* Recibo el id del usuario que mando la peticion */

    const myRequest = req.query;
    console.log("Get datos de dashboard");

    try {
        /* Ordenes pendientes general */
        const orders_to_pick = await Order.countDocuments({
            order_picked: false,
            order_packed: false,
            order_asigned_to: null,
            order_problem: null,
            payment_status: "paid",
            next_action: "waiting_packing",
            shipping_status: "unpacked"
        });

        /* Ordenes pendientes por el user */
        const pending_orders = await Order.countDocuments({
            order_picked: true,
            order_packed: false,
            order_asigned_to: myRequest.user,
            order_problem: null,
            payment_status: "paid",
            next_action: "waiting_packing",
            shipping_status: "unpacked"
        });

        let today_init = new Date();
        let today = new Date();
        today_init.setHours(00,00,00);

        /* Ordenes empaquetadas por el user hoy */
        const packed_orders_today = await Order.countDocuments({
            order_picked: true,
            order_packed: true,
            order_problem: null,
            payment_status: "paid",
            packed_at: { $gte: today_init, $lte: today}
        })

        res.json({
            orders_to_pick,
            pending_orders,
            packed_orders_today
        });

    } catch (error) {
        res.json({err: "Error has been ocurred"});
    }
}