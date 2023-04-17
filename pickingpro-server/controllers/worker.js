const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");

module.exports.getTransactionsDataWorker = async () => {
    try {
        let today = getPreviousDay();
        let today_init = new Date();
        today_init.setHours(00,00,00);
        const storeinfoDB = await Store.find();
        let transactions = [];
        let transactions_db = [];
        let transactions_to_add = [];
        today = today.toISOString().split("T")[0];
        console.log("Transacciones de hoy ",  today);

        // Traigo la data de cada una de las tiendas desde Tiendanube
        for (const stores of storeinfoDB) {
            try {
                const orders_today = await Order.find({
                    store_id: stores.user_id,
                    payment_status: "paid",
                    paid_at: { $gte: today}
                })

                const { data } = await axios.get(
                    `https://api.tiendanube.com/v1/${stores.user_id}/orders?created_at_min=${today}`,
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
                        transactions: data.length,
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
        
        return {
            internalData: transactions_db,
            externalData: transactions,
            transactions_to_add: transactions_to_add,
            date: today   
        };
    } catch (error) {
        console.log(error);
        return{err: "Error has been ocurred"};
    }
}
