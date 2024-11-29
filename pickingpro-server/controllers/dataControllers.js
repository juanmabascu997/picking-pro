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
                        `https://api.tiendanube.com/v1/${storeinfoDB.user_id}/orders?fields=id,store_id,contact_email,contact_name,contact_identification,billing_name,billing_phone,billing_zipcode,billing_city,billing_province,shipping_cost_owner,shipping_cost_customer,coupon,promotional_discount,subtotal,discount,discount_gateway,total,gateway,gateway_id,gateway_name,shipping_option,shipping_option_code,shipping_option_reference,shipping_pickup_type,created_at,payment_details,payment_count,payment_status,products,number,cancelled_at,closed_at,read_at,status,gateway_link,shipping_carrier_name,shipping_status,paid_at`,
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
    const rows = transactions.map((order) =>({
        order_id: order.id,
        created_at: order.created_at,
        customer_name: order.customer?.name || 'N/A',
        total: order.total || 0,
        currency: order.currency || 'N/A',
        status: order.status || 'N/A',
        store_id: order.store_id || 'N/A',
        contact_email: order.contact_email || 'N/A',
        contact_name: order.contact_name || 'N/A',
        contact_identification: order.contact_identification || 'N/A',
        billing_name: order.billing_name || 'N/A',
        billing_phone: order.billing_phone || 'N/A',
        billing_zipcode: order.billing_zipcode || 'N/A',
        billing_city: order.billing_city || 'N/A',
        billing_province: order.billing_province || 'N/A',
        shipping_cost_owner: order.shipping_cost_owner || 0,
        shipping_cost_customer: order.shipping_cost_customer || 0,
        coupon: JSON.stringify(order.coupon) || [],
        promotional_discount: JSON.stringify(order.promotional_discount) || {},
        subtotal: order.subtotal || 0,
        discount: order.discount || 0,
        discount_gateway: order.discount_gateway || 0,
        gateway: order.gateway || 'N/A',
        gateway_id: order.gateway_id || 'N/A',
        gateway_name: order.gateway_name || 'N/A',
        shipping_option: order.shipping_option || 'N/A',
        shipping_option_code: order.shipping_option_code || 'N/A',
        shipping_option_reference: order.shipping_option_reference || 'N/A',
        shipping_pickup_type: order.shipping_pickup_type || 'N/A',
        payment_details: JSON.stringify(order.payment_details) || {},
        payment_count: order.payment_count || 0,
        payment_status: order.payment_status || 'N/A',
        products: JSON.stringify(order.products) || [],
        number: order.number || 'N/A',
        cancelled_at: order.cancelled_at || null,
        closed_at: order.closed_at || null,
        read_at: order.read_at || null,
        gateway_link: order.gateway_link || 'N/A',
        shipping_carrier_name: order.shipping_carrier_name || 'N/A',
        shipping_status: order.shipping_status || 'N/A',
        paid_at: order.paid_at || null,
    }));
    

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows);

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const filePath = path.join(__dirname, `${storeName}_orders.xlsx`);
    xlsx.writeFile(workbook, filePath);

    return filePath;
}
