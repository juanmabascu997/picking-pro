const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { getInfoByID } = require("../middlewares/infoMiddleware");
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');


module.exports.getDashboardData = async (req, res) => {
    /* Recibo el id del usuario que mando la peticion */
    try {
        const token = req.query.token;
        const primeraFecha = req.query.primeraFecha;
        const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
        const userId = payload.id;
        
        let response = await getInfoByID(userId, primeraFecha)
        res.json(response)
    } catch (error) {
        res.json({err: "Error has been ocurred in getDashboardData"});
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



module.exports.getTransactionsDataByDate = async (req, res) => {
    try {
        let transactions = [];

        const created_at_min = new Date(req.query.created_at_min);
        const created_at_max = new Date(req.query.created_at_max);

        if(created_at_min > created_at_max) {
            return res.status(404).send('Revise sus parametros. La fecha minima es mayor que la maxima.');
        }

        created_at_min.setHours(0, 0, 0);
        created_at_max.setHours(23, 59, 59);

        console.log(created_at_min, created_at_max);
        
        const storeName = req.query.storeName;

        let page = 1;
        let hasMore = true;

        const storeinfoDB = await Store.findOne({
            nombre: storeName
        });
        
        if(storeinfoDB.nombre == storeName) {
            while (hasMore) {
                try {
                    const { data } = await axios.get(
                        `https://api.tiendanube.com/v1/${storeinfoDB.user_id}/orders`,
                        {
                            params: {
                                page,
                                per_page: 30,
                                created_at_min: created_at_min ?? null,
                                created_at_max: created_at_max ?? null,
                            },
                            headers: {
                                Authentication: "bearer " + storeinfoDB.access_token,
                                "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
                            },
                        }
                    );
    
                    if(data) {
                        transactions.push(...data);
                    }

                    console.log(`Page ${page}: ${data.length} orders retrieved.`);
                    hasMore = data.length === 30;
                    page++;
                } catch (error) {
                    console.error(`Error fetching orders for store ${storeinfoDB.nombre} on page ${page}:`, error.message);
                    hasMore = false;
                }
            }

            if(transactions.length === 0) {
                return res.status(404).send('Revise sus parametros. No se encontraron datos de busqueda.');
            }
            
            const filePath = generateExcelFile(transactions, storeinfoDB.nombre);

            res.setHeader('Content-Disposition', `attachment; filename=${storeName}_orders.xlsx`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error al descargar el archivo:', err);
                    return res.status(500).send('Error al descargar el archivo');
                } else {
                    fs.unlinkSync(filePath);
                }
            });

        } else {
            return res.status(404).send('Revise sus parametros. No se encontró tienda seleccionada.');
        }
    } catch (error) {
        res.json({err: "Error has been ocurred"});
    }
}

function generateExcelFile(transactions, storeName) {    
    const rows = transactions.map((order) => ({
        OrderID: order.id,
        CreatedAt: order.created_at,
        CustomerName: order.customer?.name || 'N/A',
        Total: order.total || 0,
        Currency: order.currency || 'N/A',
        Status: order.status || 'N/A',
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows);

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const filePath = path.join(__dirname, `${storeName}_orders.xlsx`);
    xlsx.writeFile(workbook, filePath);

    return filePath;
}
