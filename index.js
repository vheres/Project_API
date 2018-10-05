const express = require('express');
var bodyParser = require('body-parser')
const cors = require('cors');
const mysql = require('mysql');

var crypto = require('crypto');

var app = express();
var url = bodyParser.urlencoded({ extended: false })
const port = 1995;

app.set('view engine', 'ejs')

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'william',
    password: '0sampai1',
    database: 'boots',
    port: 3306
})

app.use(url);
app.use(bodyParser.json());
app.use(cors());

app.get('/cart', function(req, res) {
    var sql = `select ca.id, ca.user_id, u.username, ca.product_id, i.link, i.name as product_name, i.gender, i.brand_id, b.name as brand, ca.color_id, co.name as color, ca.size_id, si.name as size, ca.quantity, ca.price, st.id as stock_id
    from cart ca join users u on ca.user_id = u.id join inventory i on ca.product_id = i.id join brand b on i.brand_id = b.id join color co on ca.color_id = co.id join size si on ca.size_id = si.id join stock st on st.product_id = i.id and st.color_id = co.id and st.size_id = si.id
    where user_id = ${req.query.id};`
    conn.query(sql, (err, result) => {
        if(err) throw err;

        res.send({ cart: result })
    })
})

app.get('/transaction_history', function(req, res) {
    var sql = `select * from transaction where user_id = ${req.query.id};`
    conn.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result)

        res.send({ transactions: result })
    })
})

app.get('/transaction_select', function(req, res) {
    var sql = `select td.id, td.transaction_id, i.name as product, co.name as color, si.name as size, td.quantity, td.price from transaction_detail td join inventory i on td.product_id = i.id join color co on td.color_id = co.id join size si on td.size_id = si.id where transaction_id = ${req.query.id};`
    conn.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result)

        res.send({ transaction_select: result })
    })
})

app.get('/detail_select_inventory', function(req, res){
    console.log(req.query)
    var sql = `select i.id, i.link, i.name, i.description, i.price, i.gender, i.brand_id, b.name as brand from inventory i join brand b on i.brand_id = b.id where i.id = ${req.query.id}`;
    var sql2 = `select st.id, st.product_id, st.color_id, c.name as color, st.size_id, si.name as size, st.stock from stock st join color c on st.color_id = c.id join size si on st.size_id = si.id where product_id = ${req.query.id} order by color, size`;
    var sql3 = `select st.color_id, c.name as color from stock st join color c on st.color_id = c.id where product_id = ${req.query.id} group by color order by color`;
    var sql4 = `select * from size;`;
    var sql5 = `select count(*) as total from color;`
    var sql6 = `select count(*) as total from size;`
    conn.query(sql, (err, result) => {
        if(err) throw err;

        conn.query(sql2, (err2, result2) => {
            if(err2) throw err2;

            conn.query(sql3, (err3, result3) => {
                if(err3) throw err3;

                conn.query(sql4, (err4, result4) => {
                    if(err4) throw err4;

                    conn.query(sql5, (err5, result5) => {
                        if(err5) throw err5;

                        conn.query(sql6, (err6, result6) => {
                            if(err6) throw err6;
                            res.send({ detail_select: result, variant: result2, product_color: result3, size: result4, color_count: result5, size_count: result6 })
                        })             
                    })
                })
            })
        })
    })
})

app.get('/search_inventory', function(req, res){
    if (req.query.minPrice === '') {
        var minPrice = 0;
    }
    else {
        minPrice = req.query.minPrice;
    }
    if (req.query.maxPrice === '') {
        var maxPrice = 999999999;
    }
    else {
        maxPrice = req.query.maxPrice;
    }
    var sql = `select count(*) as count from inventory i join brand b on i.brand_id = b.id 
            where i.name like "%${req.query.name}%" and
            i.gender like "${req.query.gender}%" and
            b.name like "%${req.query.brand}%" and
            i.price >= "${minPrice}" and
            i.price <= "${maxPrice}"`
    var sql1 = `select i.id, i.link, i.name, i.description, i.price, i.gender, i.brand_id, b.name as brand from inventory i join brand b on i.brand_id = b.id
            where i.name like "%${req.query.name}%" and
            i.gender like "${req.query.gender}%" and
            b.name like "%${req.query.brand}%" and
            i.price >= "${minPrice}" and
            i.price <= "${maxPrice}" limit ${req.query.pagination[0]}, ${req.query.pagination[1]}`;
    conn.query(sql, (err, result) => {
        if(err) throw err;

        conn.query(sql1, (err1, result1) => {

            if(err1) throw err1;
            res.send({ pagecount: result, listInventory: result1 })
        })
    })
})

app.get('/admin_variant_inventory', function(req, res){
    var sql = `select st.id, st.product_id, st.color_id, c.name as color, st.size_id, si.name as size, st.stock from stock st join color c on st.color_id = c.id join size si on st.size_id = si.id where product_id = ${req.query.id} order by color, size`;
    var sql2 = `select st.color_id, c.name as color from stock st join color c on st.color_id = c.id where product_id = ${req.query.id} group by color order by color`
    conn.query(sql, (err, result) => {
        if(err) throw err;

        conn.query(sql2, (err2, result2) => {
            if(err2) throw err2;
            res.send({variant:result, product_color:result2})
        })
    })
})

app.get('/table_list', function(req,res){
    var sql = `select table_name from information_schema.tables where table_schema = "boots"`;
    conn.query(sql, (err, result) => {
        if(err) throw err;
        res.send({table_list:result})
    })
})

app.get('/not_exist_color', function(req,res){
    var sql = `select c.id, c.name as color from color c where name not in (select c.name from color c join stock s on c.id = s.color_id where product_id = ${req.query.id} group by c.name)`;
    conn.query(sql, (err, result) => {
        if(err) throw err;
        res.send({color: result})
    })
})

app.get('/inventory', function(req,res){
    console.log(req.query.pagination)
    var sql = `select count(*) as count from inventory;`
    var sql1 = `select i.id, i.link, i.name, i.description, i.price, i.gender, b.name as brand, i.brand_id 
                from inventory i join brand b on i.brand_id = b.id limit ${req.query.pagination[0]}, ${req.query.pagination[1]};`;
    var sql2 = `select * from brand;`;
    var sql3 = `select * from color order by name;`;
    var sql4 = `select * from size order by name;`;
    var sql5 = `select count(*) as total from color;`
    var sql6 = `select count(*) as total from size;`
    var sql7 = `select distinct s.product_id, s.color_id from stock s join color c on s.color_id = c.id`;
    conn.query(sql, (err, result) => {
        if(err) throw err;

        conn.query(sql1, (err1, result1) => {
            if(err1) throw err1;

            conn.query(sql2, (err2, result2) => {
                if(err2) throw err2;

                conn.query(sql3, (err3, result3) => {
                    if(err3) throw err3;

                    conn.query(sql4, (err4, result4) => {
                        if(err4) throw err4;

                        conn.query(sql5, (err5, result5) => {
                            if(err5) throw err5;

                            conn.query(sql6, (err6, result6) => {
                                if(err6) throw err6;

                                conn.query(sql7, (err7, result7) => {
                                    if(err7) throw err7;

                                    res.send({ pagecount: result, listInventory: result1, listCategory: result2, listBrand: result2, listColor: result3, listSize: result4, color_count: result5, size_count: result6, distinct_items: result7 })
                                })
                            })
                        })
                    })
                })     
            })
        })
    })
})

app.get('/getsize', function(req,res){
    var sql = `select * from size`;
    conn.query(sql, (err, result) => {
        if(err) throw err;
        res.send({listSize:result})
    })
})

app.get('/distinct_inventory', function(req,res) {
    var sql = `select distinct s.product_id, c.name as color from stock s join color c on s.color_id = c.id`;
    conn.query(sql, (err,result) => {
        if(err) throw err;
        res.send({distinct_items:result})
    })
})

app.post('/inventory', function(req, res){
    console.log(req.body)
    var data = {
        link: req.body.link,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        gender: req.body.gender,
        brand_id: req.body.brand
    }
    var sql = "insert into inventory set ?";
    conn.query(sql, data, (err, result) => {
        if(err) throw err;

        var sql1 = `select i.id, i.link, i.name, i.description, i.price, i.gender, i.brand_id, b.name as brand from inventory i join brand b on i.brand_id = b.id;`
        conn.query(sql1, (err1, result1) => {
            if(err1) throw err1;
            res.send({ listInventory: result1 })
        })
    })
})

app.post('/input_variant', function(req, res){
    console.log(req.body)
    var data = {
        product_id: req.body.product_id,
        color_id: req.body.color_id,
        size_id: req.body.size_id,
        stock: req.body.stock
    }
    var sql = "insert into stock set ?";
    var sql1 = `select st.id, st.product_id, st.color_id, c.name as color, st.size_id, si.name as size, st.stock from stock st join color c on st.color_id = c.id join size si on st.size_id = si.id where product_id = ${req.body.product_id} order by color, size;`
    var sql2 = `select st.color_id, c.name as color from stock st join color c on st.color_id = c.id where product_id = ${req.body.product_id} group by color order by color`
    conn.query(sql, data, (err, result) => {
        if(err) throw err;

        conn.query(sql1, (err1, result1) => {
            if(err1) throw err1;

            conn.query(sql2, (err2, result2) => {
                if(err2) throw err2;

                res.send({ variant: result1, product_color:result2 })
            })
        })
    })
})

app.post('/brand', function(req, res) {
    var data = {
        name: req.body.name
    }
    var sql = "insert into brand set ?";
    var sql2 = "select * from brand";
    conn.query(sql, data, (err, result) => {
        if(err) throw err;

        conn.query(sql2, (err2, result2) => {
            if(err2) throw err2;

            res.send({ listBrand: result2 })
        })
    })
})

app.post('/color', function(req, res) {
    var data = {
        name: req.body.name
    }
    var sql = "insert into color set ?";
    var sql2 = "select * from color";
    conn.query(sql, data, (err, result) => {
        if(err) throw err;

        conn.query(sql2, (err2, result2) => {
            if(err2) throw err2;

            res.send({ listColor: result2 })
        })
    })
})

app.post('/size', function(req, res) {
    var data = {
        name: req.body.name
    }
    var sql = "insert into size set ?";
    var sql2 = "select * from size";
    var sql3 = `select id from size where name = ${req.body.name}`
    conn.query(sql, data, (err, result) => {
        if(err) throw err;

        conn.query(sql2, (err2, result2) => {
            if(err2) throw err2;

            conn.query(sql3, (err3, result3) => {
                if(err3) throw err3;

                res.send({ listSize: result2, new_size_id: result3 })
            })
        })
    })
})

app.post('/input_all_product_size', function(req, res) {
    var sql = "insert into stock (`product_id`, `color_id`, `size_id`, `stock`) values " + req.body.sql_query;
    conn.query(sql, (err, result) => {
        if(err) throw err;
    })
})

app.post('/add_to_cart', function(req, res) {
    var data = {
        user_id: req.body.id,
        product_id: req.body.product_id,
        color_id: req.body.color_id,
        size_id: req.body.size_id,
        quantity: req.body.quantity,
        price: req.body.price
    }
    var sql = `select * from cart where user_id= ${req.body.id} and product_id= ${req.body.product_id} and color_id= ${req.body.color_id} and size_id= ${req.body.size_id}`;
    var sql1 = `insert into cart set ?`;
    conn.query(sql, (err, result) => {
        if(err) throw err;
        if (result.length === 0) {
            conn.query(sql1, data, (err1, result1) => {
                if(err1) throw err1;

                res.send({result1})
            })
        }
        else if (result.length > 0) {
            var newQty = result[0].quantity + parseInt(req.body.quantity);
            var newPrice = result[0].price + req.body.price;
            if (newQty > req.body.current_stock) {
                res.send({ info: `your order (${newQty}) exceed the remaining stock (${req.body.current_stock}), please check your cart! `})
            }
            else {
                var sql2 = `update cart set quantity = ${newQty}, price = ${newPrice} where id = ${result[0].id}`
                conn.query(sql2, (err2, result2) => {
                    if(err2) throw err2;
    
                    res.send({result2})
                })
            }          
        }
    })
})

app.post('/check_out', function(req, res) {
    var stock_ids = `(`
    req.body.cart.map((item, count) => {
        if (count < (req.body.cart.length-1)) {
            stock_ids += `${item.stock_id}, `;
        }
        else {
            stock_ids += `${item.stock_id})`;
        }
    })
    var checksql = `select * from stock where id in ${stock_ids}`;
    conn.query(checksql, (checkErr, checkResult) => {
        if(checkErr) throw checkErr;
            var stockErr = new Array();
            checkResult.map((item,count) => {
                if ( req.body.cart[count].quantity > checkResult[count].stock) {
                    stockErr.push(`your order for item\n${req.body.cart[count].product_name}\ncolor: ${req.body.cart[count].color}\nsize: ${req.body.cart[count].size}\namount: ${req.body.cart[count].quantity}\nexceed the remaining stock (${checkResult[count].stock})\n`);
                }
            })
            console.log(stockErr.length)
            if (stockErr.length > 0) {
                res.send({stockErr: stockErr});
            }
            else {
               
                var d = new Date();
                var date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
                var time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
                var sql = `insert into transaction (user_id, date, time, total_price) values ('${req.body.user_id}', '${date}', '${time}', '${req.body.total_price}')`
                var sql2 = `select * from transaction where user_id = '${req.body.user_id}' and date = '${date}' and time = '${time}' and total_price = '${req.body.total_price}'`
                conn.query(sql, (err, result) => {
                    if(err) throw err;
                    conn.query(sql2, (err2, result2) => {
                        if(err2) throw err2;
                        var sql3 = `insert into transaction_detail (transaction_id, product_id, color_id, size_id, quantity, price) values `;
                        var data = ``;
                        req.body.cart.map((item, count) => {
                            if ( count < (req.body.cart.length-1)) {
                                data += `('${result2[0].id}', '${item.product_id}', '${item.color_id}', '${item.size_id}', '${item.quantity}', '${item.price}'), `
                            }
                            else {
                                data += `('${result2[0].id}', '${item.product_id}', '${item.color_id}', '${item.size_id}', '${item.quantity}', '${item.price}')`
                            }
                        })
                        sql3 += data;
                        conn.query(sql3, (err3, result3) => {
                            if(err3) throw err3;
                            var ids = `(`
                            console.log(req.body.cart)
                            req.body.cart.map((item, count) => {
                                var updatesql = `update stock set stock = stock - ${item.quantity} where id = ${item.stock_id}`
                                conn.query(updatesql, (updateErr, updateResult) => {
                                    console.log('sampe sini')
                                    if(updateErr) throw updateErr;
                                })
                                if (count < (req.body.cart.length-1)) {
                                    ids += `${item.id}, `
                                }
                                else {
                                    ids += `${item.id})`
                                }
                            })
                            var sql4 = `delete from cart where id in ${ids}`
                            
                            conn.query(sql4, (err4,result4) => {
                                if (err4) throw err4;
    
                                res.send({result4})
                            })
                        })
                    })
                })
            }
    })
})

app.delete('/inventory', function(req, res){
    var sql = `delete from inventory where id = ${req.query.id}`
    var sql1 = `delete from stock where product_id = ${req.query.id}`
    var sql2 = `select i.id, i.link, i.name, i.description, i.price, i.gender, b.name as brand, i.brand_id from inventory i join brand b on i.brand_id = b.id;`
    conn.query(sql, (err, result) => {
        if(err) throw err;
 
        conn.query(sql1, (err1, result1) => {
            if(err1) throw err1;

            conn.query(sql2, (err2, result2) => {
                if(err2) throw err2;
                res.send({ listInventory: result2 })
            })           
        })
    })
})

app.delete('/remove_cart_item', function(req, res){
    var sql = `delete from cart where id = ${req.query.cart_id}`
    var sql1 = `select ca.id, ca.user_id, u.username, ca.product_id, i.link, i.name as product_name, i.gender, i.brand_id, b.name as brand, ca.color_id, co.name as color, ca.size_id, si.name as size, ca.quantity, ca.price, st.id as stock_id 
    from cart ca join users u on ca.user_id = u.id join inventory i on ca.product_id = i.id join brand b on i.brand_id = b.id join color co on ca.color_id = co.id join size si on ca.size_id = si.id join stock st on st.product_id = i.id and st.color_id = co.id and st.size_id = si.id
    where user_id = ${req.query.user_id}`
    conn.query(sql, (err, result) => {
        if(err) throw err;
 
        conn.query(sql1, (err1, result1) => {
            if(err1) throw err1;

            res.send({ cart: result1 })
        })
    })
})

app.delete('/remove_variant', function(req, res){
    var sql = `delete from stock where product_id = ${req.query.id} and color_id = ${req.body.color_id}`
    var sql1 = `select st.id, st.product_id, st.color_id, c.name as color, st.size_id, si.name as size, st.stock from stock st join color c on st.color_id = c.id join size si on st.size_id = si.id where product_id = ${req.body.product_id} order by color, size;`
    var sql2 = `select st.color_id, c.name as color from stock st join color c on st.color_id = c.id where product_id = ${req.body.product_id} group by color order by color`
    conn.query(sql, (err, result) => {
        if(err) throw err;
 
        conn.query(sql1, (err1, result1) => {
            if(err1) throw err1;

            conn.query(sql2, (err2, result2) => {
                if(err2) throw err2;
                res.send({ variant: result1, product_color:result2 })
            })           
        })
    })
})

app.put('/edit_product', function(req, res){
    const data = {
        link: req.body.link,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        gender: req.body.gender,
        brand_id: req.body.brand
    }
    const data2 = {
        product_id: req.body.id,
        color_id: req.body.color,
        size_id: req.body.size,
        stock: req.body.stock
    }
    var sql = `update inventory set ? where id = ${req.query.id}`
    var sql1 = `update stock set ? where id = ${req.body.stock_id}`
    conn.query(sql, data, (err, result) => {
        if(err) {
            res.send({err, status : "Error"})
        }

        conn.query(sql1, data2, (err1, result1) => {
            if(err1) throw err1;

            var sql2 = `select st.id, st.product_id, st.color_id, c.name as color, st.size_id, si.name as size, st.stock from stock st join color c on st.color_id = c.id join size si on st.size_id = si.id where product_id = ${req.query.id} order by color, size`;
            conn.query(sql2, (err2, result2) => {
                if(err2) throw err2;
                res.send({ variant: result2 })
        })       
        })
    })
})

app.get('/users', function(req, res){
    if (Object.keys(req.query).length === 2) {
        var cipher = crypto.createHmac("sha256", "password").update(req.query.password).digest("hex");
        var sql = "select * from users where email = '" + req.query.email + "' and password = '" + cipher + "';";
        console.log('executing login procedure')
        conn.query(sql, (err, result) => {
            if(err) throw err;
            res.send({id:result[0].id, username: result[0].username, email: result[0].email});
        })
    }
    else if (Object.keys(req.query).length === 1) {
        var sql = "select * from users where email = '" + req.query.email + "';";
        console.log('executing keep login procedure')
        conn.query(sql, (err, result) => {
            if(err) throw err;
            res.send({id:result[0].id, username: result[0].username, email: result[0].email});
        })
    }
    
})

app.post('/users', function(req, res) {
    var cipher = crypto.createHmac("sha256", "password").update(req.body.password).digest("hex")
    var data = {
        username: req.body.username,
        email: req.body.email,
        password: cipher
    }
    console.log(cipher);
    var sql = `select * from users where username = '${req.body.username}' or email = '${req.body.email}'`
    var sql1 = `insert into users set ?`;
    var sql2 = `select * from users where email = '${req.body.email}' and password = '${cipher}'`;
    conn.query(sql, (err, result) => {
        if (result.length === 0) {
            conn.query(sql1, data, (err1, result1) => {
                if(err1) throw err1;       
                conn.query(sql2, (err2, result2) => {
                    console.log('result2')
                    console.log(result2)
                    if(err2) throw err2;
                    res.send({id:result2[0].id, username: result2[0].username, email: result2[0].email})
                })
            })   
        }
        else {
            res.send({ error: `username or email already exist!`})
        } 
    })
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`));