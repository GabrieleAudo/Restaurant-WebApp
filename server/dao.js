'use strict';

//Data Access Object (DAO) module

const db = require('./db');

db.run('PRAGMA foreign_keys = ON');//to ensure that foreign keys and on delete cascade work correctly

const convertIngredientFromDbRecord = (dbRecord) => {
  const ingredient = {};
  ingredient.id = dbRecord.id;
  ingredient.name = dbRecord.name;
  ingredient.price = dbRecord.price;
  ingredient.limited = dbRecord.limited;
  ingredient.quantity = dbRecord.quantity;
  return ingredient;
}

const convertDishFromDbRecord = (dbRecord) => {
  const dish = {};
  dish.id = dbRecord.id;
  dish.label = dbRecord.label;
  return dish;
}

const convertSizeFromDbRecord = (dbRecord) => {
  const size = {};
  size.id = dbRecord.id;
  size.label = dbRecord.label;
  size.price = dbRecord.price;
  size.maxIngredients = dbRecord.max_ingredients;
  return size;
}

const convertOrderFromDbRecord = (dbRecord) => {
  const order = {};
  order.id = dbRecord.id;
  order.dish_id = dbRecord.dish_id;
  order.size_id = dbRecord.size_id;
  order.total_price = dbRecord.total_price;
  order.user_id = dbRecord.user_id;
  return order;
}

//this function gets all dishes in the DB
exports.getAllDishes = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM dishes';
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (!rows || rows.length == 0) {
          resolve({ error: 'No dishes in DB.' });
        } else {
          const dishes = rows.map((d) => {
            const dish = convertDishFromDbRecord(d);
            return dish;
          });
          resolve(dishes);
        }

      }
    });
  });
};

//this function gets all sizes in the DB
exports.getAllSizes = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sizes';
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (!rows || rows.length == 0) {
          resolve({ error: 'No sizes in DB.' });
        } else {
          const sizes = rows.map((s) => {
            const size = convertSizeFromDbRecord(s);
            return size;
          });
          resolve(sizes);
        }

      }
    });
  });
};

// This function retrieves a dish given its id
exports.getDish = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM dishes WHERE id LIKE ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (!row) {
          resolve({ error: 'Dish not found.' });
        } else {
          const dish = convertDishFromDbRecord(row);
          resolve(dish);
        }
      }
    });
  });
};

// This function retrieves a size given its id
exports.getSize = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sizes WHERE id LIKE ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (!row) {
          resolve({ error: 'Size not found.' });
        } else {
          const size = convertSizeFromDbRecord(row);
          resolve(size);
        }
      }
    });
  });
};



// This function retrieves an ingredient given its id
exports.getIngredient = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM ingredients WHERE id=?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (!row) {
          resolve({ error: 'Ingredient not found.' });
        } else {
          const ingredient = convertIngredientFromDbRecord(row);
          resolve(ingredient);
        }
      }
    });
  });
};

// This function retrieves an ingredient given its name
exports.getIngredientByName = (name) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM ingredients WHERE name LIKE ?';
    db.get(sql, [name], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (!row) {
          resolve({ error: 'Ingredient not found.' });
        } else {
          const ingredient = convertIngredientFromDbRecord(row);
          resolve(ingredient);
        }
      }
    });
  });
};

exports.getAllIngredients = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM ingredients';
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (!rows || rows.length == 0) {
          resolve({ error: 'No ingredients in DB.' });
        } else {
          const ingredients = rows.map((i) => {
            const ingredient = convertIngredientFromDbRecord(i);
            return ingredient;
          });
          resolve(ingredients);
        }

      }
    });
  });
};

//returns list of ingredient IDs incompatible to a specific ingredient
exports.getIncompatibilities = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT incompatible_id FROM incompatibilities WHERE ingredient_id=?';
    db.all(sql, [id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (!rows || rows.length == 0) { //if no incompatibilities are found just return empty array
          resolve([]);
        } else {
          const ids = rows.map((i) => {
            return i.incompatible_id;
          });
          resolve(ids);
        }

      }
    });
  });
};

//returns list of ingredient IDs required for a specific ingredient
exports.getRequirements = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT required_id FROM requirements WHERE ingredient_id=?';
    db.all(sql, [id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (!rows || rows.length == 0) {//if no requirements are found just return empty array
          resolve([]);
        } else {
          const ids = rows.map((i) => {
            return i.required_id;
          });
          resolve(ids);
        }

      }
    });
  });
};

//this function gets all orders from DB, without the list of ingredients
exports.getAllOrders = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM orders WHERE user_id=?';
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (!rows || rows.length == 0) { //if no orders are found just return empty array
          resolve([]);
        } else {
          const orders = rows.map((o) => {
            const order = convertOrderFromDbRecord(o);
            return order;
          });
          resolve(orders);
        }

      }
    });
  });
};

//This function returns an order by providing the orderId and the userId
exports.getOrderById = (orderId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM orders WHERE id=? and user_id=?';
    db.get(sql, [orderId, userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (!row) {
          resolve({ error: 'Order not found.' });
        } else {
          const order = convertOrderFromDbRecord(row);
          resolve(order);
        }
      }
    });
  });
};

//returns list of ingredients IDs of a specific order
exports.getOrderIngredients = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT ingredient_id FROM order_ingredients WHERE order_id=?';
    db.all(sql, [id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (!rows || rows.length == 0) { //if no ingredients are found just return empty array
          resolve([]);
        } else {
          const ids = rows.map((o) => {
            return o.ingredient_id;
          });
          resolve(ids);
        }

      }
    });
  });
};

//This function creates an order in the DB
exports.createOrder = (order, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO orders (dish_id, size_id, total_price, user_id) VALUES(?, ?, ?, ?)';
    db.run(sql, [order.dish, order.size, order.total, userId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);//special property of a run query
      }
    });
  });
};

//This function adds an ingredient to the ingredient list of the order
exports.addOrderIngredient = (orderId, ingredientId) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO order_ingredients (order_id, ingredient_id) VALUES(?, ?)';
    db.run(sql, [orderId, ingredientId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(ingredientId);
      }
    });
  });
};

//This function updates the selected ingredient availability by the specified amount
exports.updateIngredientAvailability = (ingredientId, quantity) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE ingredients SET quantity = ? WHERE id = ?';
    db.run(sql, [quantity, ingredientId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(ingredientId);
      }
    });
  });
};

//This function deletes an order from the DB. 
//order_ingredients has ON DELETE CASCADE so ingredients are automatically deleted
exports.deleteOrder = (id, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM orders WHERE id=? and user_id=?';
    db.run(sql, [id, userId], function (err) {
      if (err) {
        reject(err);
      } else
        resolve(id);
    });
  });
}


