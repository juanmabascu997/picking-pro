const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");
const jwt = require("jsonwebtoken");

function getPreviousDay(date = new Date()) {
    const previous = new Date(date.getTime());
    previous.setDate(date.getDate() - 1);
  
    return previous;
}

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

        /* Ordenes pendientes para empaquetar */
        const pending_orders = await Order.countDocuments({
            order_picked: true,
            order_packed: false,
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

module.exports.getTransactionsData = async (req, res) => {
    try {
        let today_end = new Date();
        let today_init = new Date();
        let date_UTC = new Date();
        let today_date = date_UTC.toISOString().split("T")[0];
        
        date_UTC.setUTCHours(date_UTC.getUTCHours()-3)
        today_init.setUTCHours(03,00,00);
        today_end.setUTCHours(23,59,59);

        const storeinfoDB = await Store.find();
        let transactions = [];
        let transactions_db = [];
        let transactions_to_add = [];
        console.log("Transacciones de hoy: ",  today_date);

        // Traigo la data de cada una de las tiendas desde Tiendanube
        for (const stores of storeinfoDB) {
            try {
                const orders_today = await Order.find({
                    store_id: stores.user_id,
                    payment_status: "paid",
                    paid_at: { $gte: today_init}
                })

                const { data } = await axios.get(
                    `https://api.tiendanube.com/v1/${stores.user_id}/orders?created_at_min=${today_date}`,
                    {
                        headers: {
                          Authentication: "bearer " + stores.access_token,
                          "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
                        },
                    }
                )
                transactions_db.push({
                    store:  stores.nombre,
                    transactions: orders_today.length,
                })

                if(data) {
                    transactions.push({
                        store:  stores.nombre,
                        transactions: data.filter(e => e.payment_status === "paid").length,
                    })
                    // Busco las transacciones que no estan en la DB

                    orders_today.map(async (internal)=>{
                        if( await data.some((external)=>{
                            return external.id === internal.id;
                        })) {
                        } else {
                            transactions_to_add.push(internal);
                        }
                        return;
                    })
                }
            } catch (error) {
                if(error.response.data.code === 404) {
                    console.log("No hay transacciones");
                    transactions.push([]);
                }
                else {
                    console.log(error.response.data.description);
                }
            }
        }
        res.json({
            internalData: transactions_db,
            externalData: transactions,
            transactions_to_add: transactions_to_add,
            date: today_date   
        });
    } catch (error) {
        console.log(error);
        res.json({err: "Error has been ocurred"});
    }
}
