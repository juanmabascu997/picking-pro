const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { writeFile } = require("fs/promises");
const fs = require("fs");
const { response } = require("express");
const User = require("../models/user");

module.exports.connectTiendanube = async (req, res) => {
  try {
    if (!req.query.code) res.json({ error: "No code" });
    const data = {
      client_id: "6152",
      client_secret: "614538868b82b2a7df803438041e41dd3f11dc77ff618a89",
      grant_type: "authorization_code",
      code: req.query.code,
    };

    /*-------HAGO UN POST CON LOS DATOS DE CONEXION---------*/
    const response = await axios.post(
      "https://www.tiendanube.com/apps/authorize/token",
      data
    );

    /*-------OBTENGO LOS DATOS DE LA TIENDA QUE ME CONECTE---------*/
    const storeinfo = await axios.get(
      `https://api.tiendanube.com/v1/${response.data.user_id}/store`,
      {
        headers: {
          Authentication: "bearer " + response.data.access_token,
          "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
        },
      }
    );
    console.log("storeinfo: ", storeinfo);
    /*-------GUARDO EN MI BASE DE DATOS---------*/
    const storeinfoDB = {
      nombre: storeinfo.data.name.es,
      user_id: response.data.user_id,
      access_token: response.data.access_token,
    };
    console.log("storeinfoDB: ", storeinfoDB);

    /* Rutina para guardar mi documento */
    await Store.create(storeinfoDB);

    /*-------GENERO LOS WEBHOOKS CORRESPONDIENTES---------*/

    //Ordenes pagas
    const responseWHOne = await axios.post(
      `https://api.tiendanube.com/v1/${storeinfoDB.user_id}/webhooks`,
      {
        event: "order/paid",
        url: "https://picking-pro-production.up.railway.app/api/wh-order",
      },
      {
        headers: {
          Authentication: "bearer " + storeinfoDB.access_token,
          "Content-Type": "application/json",
          "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
        },
      }
    );
    if (!responseWHOne.data)
      res.json({ error: "Could not connect to a webhook" });

    //Ordenes empaquetadas
    const responseWHTwo = await axios.post(
      `https://api.tiendanube.com/v1/${storeinfoDB.user_id}/webhooks`,
      {
        event: "order/packed",
        url: "https://picking-pro-production.up.railway.app/api/wh-order",
      },
      {
        headers: {
          Authentication: "bearer " + storeinfoDB.access_token,
          "Content-Type": "application/json",
          "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
        },
      }
    );

    console.log(responseWHTwo.data);

    if (!responseWHTwo.data)
      res.json({ error: "Could not connect to a webhook" });

    //Ordenes enviadas
    const responseWHThree = await axios.post(
      `https://api.tiendanube.com/v1/${storeinfoDB.user_id}/webhooks`,
      {
        event: "order/fulfilled",
        url: "https://picking-pro-production.up.railway.app/api/wh-order",
      },
      {
        headers: {
          Authentication: "bearer " + storeinfoDB.access_token,
          "Content-Type": "application/json",
          "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
        },
      }
    );
    console.log(responseWHThree.data);
    if (!responseWHThree.data)
      res.json({ error: "Could not connect to a webhook" });

    //Ordenes canceladas
    const responseWHFour = await axios.post(
      `https://api.tiendanube.com/v1/${storeinfoDB.user_id}/webhooks`,
      {
        event: "order/cancelled",
        url: "https://picking-pro-production.up.railway.app/api/wh-order",
      },
      {
        headers: {
          Authentication: "bearer " + storeinfoDB.access_token,
          "Content-Type": "application/json",
          "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
        },
      }
    );
    console.log(responseWHFour.data);
    if (!responseWHFour.data)
      res.json({ error: "Could not connect to a webhook" });

    res.json({ message: "Tienda conectada" });
  } catch (err) {
    console.log(err.data);
  }
};

module.exports.getLabelToPrint = async (req, res) => {
  try {
    const myRequest = req.query;

    //Obtengo la etiqueta de bluemail
    const { data } = await axios.post(
      "https://api.bluemail.com.ar/v1/extensions/tiendanube/etiquetas",
      {
        customerId: 917,
        store_id: myRequest.store_id,
        ids: [myRequest.id],
        match_count: false,
      },
      {
        headers: {
          "X-Midla-App-Token": "9179c923b20-a2cf-4d96-a05c-7f47d6b2c6ba",
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    await writeFile("temp.pdf", data);
    //Randomizar el nombre y luego eliminarlo!!! SE genera conflicto. Implementar timeout tambien!!
    fs.readFile("temp.pdf", (err, data) => {
      res.contentType("application/pdf");
      res.send(data);
    });
  } catch (err) {
    console.log(err);
    res.json({ message: err.data });
  }
};

module.exports.getConnectedStores = async (req, res) => {
  try {
    const storeInfoDB = await Store.find();
    res.json(storeInfoDB);
  } catch (err) {
    console.log(err.data);
    res.json({ message: "Query error" });
  }
};

module.exports.handleWebhook = async (req, res) => {
  try {
    console.log(req.body);
    let body = req.body;

    //Busco la data de la store que se recibió la actualizacion
    let storeInfo = await Store.findOne({ user_id: body.store_id }).lean();
    console.log("storeInfo: ", storeInfo);
    //Obtengo los datos de la nueva order o su actualizacion
    let { data } = await axios.get(
      `https://api.tiendanube.com/v1/${storeInfo.user_id}/orders/${body.id}?fields=id,store_id,billing_name,shipping_cost_owner,shipping_cost_customer,subtotal,discount,total,shipping_option,created_at,products,number,status,next_action,cancelled_at,note,owner_note,closed_at,read_at,status,payment_status,shipping_address,shipping_status,shipped_at,paid_at`,
      {
        headers: {
          Authentication: "bearer " + storeInfo.access_token,
          "User-Agent": "GeneradorJN (nahuelezequiel20@gmail.com)",
        },
      }
    );

    console.log("Id guardado en Tiendanube para " + body.id + " : " + data.id);

    //Chequeo antes si existe en nuestra base de datos.
    let orderData = await Order.findOne({ id: data.id }).lean();

    //Si existe, actualizo.
    if (orderData) {
      console.log(
        "Id guardado en la base de datos para " + body.id + " : " + orderData.id
      );
      console.log("The document exists on the database!: ", orderData._id);
      Order.findByIdAndUpdate(orderData._id, data, (err, docs) => {
        if (err) console.log(err);
        else
          console.log(
            "Updated Order by " +
              body.event +
              " " +
              body.id +
              " with id: " +
              docs.id
          );
      });
    }

    //Si no existe, la creo.
    if (!orderData) {
      console.log(
        "The document with id " +
          data.id +
          " : " +
          body.id +
          " doesn't exists! Creating new one... "
      );
      let orderinfoDB = data;
      orderinfoDB.order_picked = false;
      orderinfoDB.order_packed = false;
      orderinfoDB.order_asigned_to = null;
      orderinfoDB.order_asigned_to_name = null;
      orderinfoDB.order_problem = null;
      orderinfoDB.order_controlled = false;
      await Order.create(orderinfoDB);
    }

    res.status(200).json(true);
  } catch (error) {
    res.status(400).json({
        error: error,
    });
  }
};

module.exports.getProductsToPick = async (req, res) => {
  try {
    const myRequest = req.query.form;
    const token = req.query.token;
    const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
    const userId = payload.id;
    var productsToPick = [];
    let ordersDB = {};

    // let shippingOptions = {
    //     '$regex': 'Envío en',
    //     '$options': 'i'
    // };

    // if (myRequest.envio == 'cod') {
    //     shippingOptions = {
    //         '$regex': 'Pago Contraentrega',
    //         '$options': 'i'
    //     }
    // }
    // if (myRequest.envio == 'bluemail')
    //     shippingOptions = {
    //         '$regex': 'bluemail',
    //         '$options': 'i'
    //     }

    usuarioInfo = await User.find(
      {
        _id: userId,
      },
    ).lean();

    //Chekeo si el usuario tiene pedidos pickeados, sin empaquetar, sin problemas
    ordersDB = await Order.find(
      {
        payment_status: "paid",
        order_picked: false,
        order_packed: false,
        shipping_status: "unpacked",
        order_problem: null,
        order_asigned_to: userId,
        order_asigned_to_name: usuarioInfo.name,
        // order_picked_for: userId,
        // order_packed_for: userId
      },
      {
        products: 1,
        id: 1,
        number: 1,
      },
      {
        limit: myRequest.pedidos,
      }
    ).lean();

    if (!ordersDB.length) {
      //Si no los tiene, le asigno nuevos
      console.log("No products picked yet by user", userId);
      /*
                Consulta a la base de datos por:
                    Cant. pedidos,
                    Tipo de envío,
                    Que estén pagas,
                    Que estén pendientes de empaquetado.
                    ----
                    Debo traer solo los productos.
            */
      ordersDB = await Order.find(
        {
          payment_status: "paid",
          order_picked: false,
          order_packed: false,
          shipping_status: "unpacked",
          order_problem: null,
          order_picked_for: null,
        },
        {
          products: 1,
          id: 1,
          number: 1,
        },
        {
          limit: myRequest.pedidos,
        }
      ).lean();
    }

    if (!ordersDB.length)
      //Si no hay pedidos para empaquetar, respondo
      res.status(200).json([]);
    else {
      for (var i = 0; i < ordersDB.length; i++) {
        //Creo my array de objetos válidos
        for (var j = 0; j < ordersDB[i].products.length; j++) {
          //Busco por variante!! Si no se solapan variantes.
          const pos = productsToPick.findIndex(
            (product) =>
              product.product_id ==
                parseInt(ordersDB[i].products[j].product_id) &&
              product.variant_id == parseInt(ordersDB[i].products[j].variant_id)
          );
          if (pos == -1) {
            const data = {
              product_id: ordersDB[i].products[j].product_id,
              name: ordersDB[i].products[j].name,
              image_link: ordersDB[i].products[j].image.src,
              quantity: parseInt(ordersDB[i].products[j].quantity),
              variant_id: parseInt(ordersDB[i].products[j].variant_id),
              sku: ordersDB[i].products[j].sku,
              barcode: ordersDB[i].products[j].barcode,
              id: ordersDB[i].id
            };

            productsToPick.push(data);
          } else {
            productsToPick[pos].quantity += parseInt(
              ordersDB[i].products[j].quantity
            );
          }
        }
      }

      for (let i = 0; i < ordersDB.length; i++) {
        //Updateo mi database con la data del usuario
        // const result = await Order.findOneAndUpdate({ id: ordersDB[i].id }, { order_picked: true, order_asigned_to: userId, picked_at: (new Date().toISOString()) });
        usuarioInfo = await User.find(
            {
              _id: userId,
            },
        ).lean();

        const result = await Order.findOneAndUpdate(
          { id: ordersDB[i].id },
          {
            order_picked: false,
            order_asigned_to: userId,
            order_asigned_to_name: usuarioInfo.name,
            picked_at: new Date().toISOString(),
          }
        );
      }

      res.status(200).json(productsToPick);
    }
  } catch (error) {
    res.status(400).json({
        error: error,
    });
  }
};

module.exports.setProductsPicked = async (req, res) => {
  try {
    const myProducts = req.query.products;
    const userId = req.query.token;

    console.log(myProducts);
    for (let i = 0; i < myProducts.length; i++) {
      //Updateo mi database con la data del usuario
      const result = await Order.findOneAndUpdate(
        { id: myProducts[i].id },
        {
          order_picked: true,
          order_asigned_to: null,
          order_asigned_to_name: null,
          order_picked_for: userId,
          picked_at: new Date().toISOString(),
        }
      );
    }

    res.status(200).json("Exito!");
  } catch (error) {
    res.status(400).json({
        error: error,
    });
  }
};

module.exports.getProductsToPack = async (req, res) => {
  /* Consulta a la base de datos por:
        - shipping status: "unpacked"
        - Tipo de envio segun seleccion
        - payment_status: "paid"
        - order_picked: true
        - picked_by: usuario en cuestion
        - !order_problem: El pedido no tiene problemas

        -------------
        Debo traer:
        - Datos de envío
        - Productos a empaquetar
        ARMAR UNA SECCION DE INCIDENCIAS PARA DESCARTAR PEDIDOS!!
    */

  try {
    console.log({ message: "Nueva solicitud de pedido para empaquetar" });

    const myRequest = req.query.form;
    const token = req.query.token;
    const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
    const userId = payload.id;

    const productToPack = await Order.find(
      {
        payment_status: "paid",
        order_picked: true,
        order_packed: false,
        shipping_status: "unpacked",
        // shipping_option: "¡Te vamos a contactar para coordinar la entrega!",
        order_problem: null,
      },
      null
    ).lean();

    //Si no encontré productos...
    if (!productToPack.length) {
      res.status(200).json("No product to pack");
      return;
    }

    const myOrder = productToPack[0];

    const storeDB = await Store.find({
      user_id: myOrder.store_id,
    }).lean(); //Con lean convierto de documento a json!!

    const name = storeDB[0].nombre;

    myOrder.store_name = name;
    //FIJAR ACA
    res.status(200).json(productToPack);
  } catch (error) {
    res.status(400).json({
        error: error,
    });
  }
};

module.exports.reportProblem = async (req, res) => {
  try {
    const myProblem = req.body;
    console.log(myProblem);

    const filter = { id: myProblem.id };

    await Order.findOneAndUpdate(filter, { order_problem: myProblem.value });

    res.status(200).json({ status: "ok", data: myProblem.value });
  } catch (error) {
    res.status(400).json({
        error: error,
    });
  }
};

module.exports.isBeingPackagedBy = async (req, res) => {
  try {
    const myRequest = req.body.myRequest;
    const token = req.body.token;
    const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
    const userId = payload.id;

    //Controlo que la orden no este asignada a otro usuario:
    const product = await Order.find({ id: myRequest.id });
    if (product[0].order_asigned_to == null) {
        usuarioInfo = await User.find(
          {
            _id: userId,
          },
        ).lean();
        const orderPacked = await Order.findOneAndUpdate(
            { id: myRequest.id },
            { order_asigned_to: userId, order_asigned_to_name: usuarioInfo.name }
          );
        res.json(true);
    } 
    else if (product[0].order_asigned_to !== userId) {
        res.json("El producto esta asignado a otro usuario.");
    }
  } catch (error) {
    console.error(error)
  }
};

module.exports.stopBeingPackaged = async (req, res) => {
  try {
    const myRequest = req.body.myRequest;

    const orderPacked = await Order.findOneAndUpdate(
      { id: myRequest.id },
      { order_asigned_to: null, order_asigned_to_name: null }
    );

    res.status(200).json(true);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: error,
    });
  }
};

module.exports.packOrder = async (req, res) => {
  try {
    /* Formato de myRequest: {id, store_id} */
    const myRequest = req.body.myRequest;
    const token = req.body.token;
    const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
    const userId = payload.id;

    //Busco el token de la store que se recibió la actualizacion
    let storeInfo = await Store.findOne({ user_id: myRequest.store_id }).lean();

    //POSTeo en tiendanube que empaquete la orden
    const { data } = await axios.post(
      `https://api.tiendanube.com/v1/${myRequest.store_id}/orders/${myRequest.id}/pack`,
      {},
      {
        headers: {
          Authentication: `bearer ${storeInfo.access_token}`,
          "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
        },
      }
    );

    //Updateo la orden en mi base de datos
    /* Deberia updatear todos los datos pertinentes ,
            No se puede depender de que tiendanube nos updatee a nosotros
            la base de datos con el webhook */
    const orderPacked = await Order.findOneAndUpdate(
      { id: myRequest.id },
      {
        order_packed: true,
        order_packed_for: userId,
        packed_at: new Date().toISOString(),
      }
    );

    res.status(200).json(true);
  } catch (error) {
    res.status(400).json({
        error: error,
    });
  }
};

module.exports.getOrdersWithProblem = async (req, res) => {
  try {
    const ordersWithProblem = await Order.find({
      order_problem: { $ne: null },
    }).lean();
    console.log(ordersWithProblem);
    res.status(200).json(ordersWithProblem);
  } catch (error) {
    console.log(error);
    res.status(400).json({
        error: error,
    });
  }
};

module.exports.solveProblem = async (req, res) => {
  try {
    /* Formato de myRequest: {id} */
    const myRequest = req.body;
    console.log(myRequest);

    //Updateo la orden en mi base de datos. No asignada a nadie, y sin problema.
    const orderSolved = await Order.findOneAndUpdate(
      { id: myRequest.id },
      { order_asigned_to: null, order_asigned_to_name: null, order_picked: false, order_problem: null }
    );

    console.log(orderSolved);
    res.status(200).json({ message: "Order updated" });
  } catch (error) {
    res.status(400).json({
        error: error,
    });
  }
};

module.exports.getOrdersToShip = async (req, res) => {
  /* Debo obtener todos los pedidos con envío en el día
        que no estén enviados y que hayan sido empaquaquetados */

  try {
    const ordersToShipOne = await Order.find({
      order_picked: true,
      order_packed: true,
      shipping_status: "unshipped",
      next_action: "waiting_shipment",
      order_controlled: false,
      shipping_option: {
        $regex: "Envío en",
        $options: "i",
      },
    }).lean();

    const ordersToShipTwo = await Order.find({
      order_picked: true,
      order_packed: true,
      shipping_status: "unshipped",
      next_action: "waiting_shipment",
      order_controlled: false,
      shipping_option: {
        $regex: "Pago Contraentrega",
        $options: "i",
      },
    }).lean();

    const ordersToShip = ordersToShipOne.concat(ordersToShipTwo);

    res.status(200).json(ordersToShip);
  } catch (error) {
    console.log(error);
    res.status(400).json({
        error: error,
    });
  }
};
