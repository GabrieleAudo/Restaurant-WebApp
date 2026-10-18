'use strict';

//initial setup
const express = require('express');
const morgan = require('morgan');  // logging middleware
const { check, validationResult } = require('express-validator'); // validation middleware
const cors = require('cors');

//modules for accessing the db
const dao = require('./dao');
const userDao = require('./dao-users');

//express initialization
const app = new express();
const port = 3001;
app.use(morgan('dev'));
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true
};
app.use(cors(corsOptions));

//authentication setup
const passport = require('passport');// authentication middleware
const LocalStrategy = require('passport-local');// authentication strategy (username and password)
const base32 = require('thirty-two');
const TotpStrategy = require('passport-totp').Strategy; // totp


/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if (!user)
    return callback(null, false, 'Incorrect username or password');

  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + username + name 
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name 
  return callback(null, user); // this will be available in req.user
});

/** Creating the session */
const session = require('express-session');

app.use(session({
  secret: "fc37d0aa55f6f69fb6ad9b737bd903e454953c326ced9b1956761aa8df673a8f", //random 32 bytes value in hex. The secret is used to encrypt the session
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

passport.use(new TotpStrategy(
  function (user, done) {
    // In case .secret does not exist, decode() will return an empty buffer
    return done(null, base32.decode(user.secret), 30);  // 30 = period of key validity
  })
);

/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized' });
}

function isTotp(req, res, next) {
  if (req.session.method === 'totp')
    return next();
  return res.status(401).json({ error: 'Missing TOTP authentication' });
}

const maxFieldLength = 150; //defining a max length for any text field

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

//Server APIs

//retrieve list of ingredients with all their requirements and incompatibilities, no login required
app.get('/api/ingredients', async (req, res) => {
  try {
    const ingredients = await dao.getAllIngredients();

    const completeIngredients = await Promise.all(//Promise.All takes an array of promises and creates a single promise that resolves when all are solved
      //get all requirements and incompatibilities IDs from DB
      ingredients.map(async (ingredient) => {
        const requiredIds = await dao.getRequirements(ingredient.id);
        const incompatibilitiesIds = await dao.getIncompatibilities(ingredient.id);
        //get all required ingredients names
        const requiredIngredients = await Promise.all(
          requiredIds.map(async (required_id) => {
            const required = await dao.getIngredient(required_id);
            return required.name;
          })
        );
        //get all incompatible ingredients names
        const incompatibleIngredients = await Promise.all(
          incompatibilitiesIds.map(async (incompatible_id) => {
            const incompatible = await dao.getIngredient(incompatible_id);
            return incompatible.name;
          })
        );

        const completeIngredient = {};
        completeIngredient.id = ingredient.id;
        completeIngredient.name = ingredient.name;
        completeIngredient.price = ingredient.price;
        completeIngredient.limited = ingredient.limited;
        completeIngredient.quantity = ingredient.quantity;
        completeIngredient.required = requiredIngredients;
        completeIngredient.incompatible = incompatibleIngredients;

        return completeIngredient
      })
    );

    res.json(completeIngredients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load ingredients.' });
  }
});

//Retrieves the list of available dishes, no login required
app.get('/api/dishes', async (req, res) => {
  try {
    const dishes = await dao.getAllDishes();
    res.json(dishes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dishes.' });
  }
});

//Retrieves the list of available sizes, no login required
app.get('/api/sizes', async (req, res) => {
  try {
    const sizes = await dao.getAllSizes();
    res.json(sizes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load sizes.' });
  }
});

//Retrieves the list of all orders submitted by the user, user must be logged in, but totp is not required
app.get('/api/orders', isLoggedIn, async (req, res) => {
  const userId = req.user.id; //get user from session info
  try {
    const orders = await dao.getAllOrders(userId);
    const completeOrders = await Promise.all(orders.map(async (order) => {
      const ingredientsIds = await dao.getOrderIngredients(order.id);
      //get all order ingredients names
      const orderIngredientsNames = await Promise.all(
        ingredientsIds.map(async (id) => {
          const ingredient = await dao.getIngredient(id);
          return ingredient.name;
        })
      );
      //get the dish and size objects from DB
      const dish = await dao.getDish(order.dish_id);
      const size = await dao.getSize(order.size_id);

      const completeOrder = {};

      completeOrder.id = order.id;
      completeOrder.dish = dish.label;
      completeOrder.size = size.label;
      completeOrder.total = order.total_price;
      completeOrder.ingredients = orderIngredientsNames

      return completeOrder;
    }));

    res.json(completeOrders);

  } catch (error) {
    console.error("Error while fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Posts a new order to the server
app.post('/api/orders', isLoggedIn, [
  check("dish").isLength({ min: 1, max: maxFieldLength }),
  check("size").isLength({ min: 1, max: maxFieldLength }),
  check("ingredients").isArray()
], async (req, res) => {

  // Is there any validation error?
  const errors = validationResult(req).formatWith(errorFormatter); // format error message
  if (!errors.isEmpty()) {
    return res.status(422).json(errors.errors); // error message is sent back as a json with the error info
  }

  const order = req.body;
  const userId = req.user.id;

  try {
    //check if dish exists in DB
    const dish = await dao.getDish(order.dish);
    if (!dish || dish.error) { //in case of errors, promise resolves to an object with an "error" field
      return res.status(400).json({ error: `Invalid dish: ${order.dish}` });
    }

    //check if size exists in DB
    const size = await dao.getSize(order.size);
    if (!size || size.error) { //in case of errors, promise resolves to an object with an "error" field
      return res.status(400).json({ error: `Invalid size: ${order.size}` });
    }

    //remove possible ingredient duplicates
    const uniqueIngredients = [];
    for (let i = 0; i < order.ingredients.length; i++) {
      if (!uniqueIngredients.includes(order.ingredients[i])) { //order.ingredients[i] is a string
        uniqueIngredients[i] = order.ingredients[i];
      }
    }
    order.ingredients = uniqueIngredients;

    //check if number of ingredients is less or equal tham maximum
    if (order.ingredients.length > size.maxIngredients) {
      return res.status(400).json({ error: `Invalid number of ingredients for ${order.size}` });
    }

    //check if ingredients are in DB and compute total cost of ingredients server-side
    let totalIngredientsPrice = 0;
    for (let name of order.ingredients) { //iterate on elements of order.ingredients array
      const ingredient = await dao.getIngredientByName(name);
      if (!ingredient || ingredient.error) {
        return res.status(404).json({ error: `Ingredient ${id} not found.` });
      }
      if (ingredient.limited && ingredient.quantity <= 0) {
        return res.status(400).json({ error: `Ingredient "${ingredient.name}" is not available.` });
      }
      totalIngredientsPrice += ingredient.price;
    }

    //check incompatibilities
    for (const ingredientName of order.ingredients) {
      const ingredient = await dao.getIngredientByName(ingredientName);
      const incompatibilitiesIds = await dao.getIncompatibilities(ingredient.id);
      for (const ingredientName2 of order.ingredients) {
        const ingredient2 = await dao.getIngredientByName(ingredientName2);
        if (ingredient.id !== ingredient2.id && incompatibilitiesIds.includes(ingredient2.id)) {
          return res.status(400).json({ error: `Ingredient ${ingredient.name} is incompatible with ${ingredient2.name}` });
        }
      }
    }

    //check requirements
    for (const ingredientName1 of order.ingredients) {
      //get ingredient object
      const ingredient1 = await dao.getIngredientByName(ingredientName1);
      //get requirements for current ingredient
      const requiredIds = await dao.getRequirements(ingredient1.id);
      //cycle on ids from required ingredients ids
      for (const ingredientId2 of requiredIds) {
        //get ingredient object
        const ingredient2 = await dao.getIngredient(ingredientId2);
        //if order ingredients doesn't include one of the requirements names -> error
        if (!order.ingredients.includes(ingredient2.name)) {
          return res.status(400).json({ error: `Ingredient ${ingredient1.name} requires ${ingredient2.name}` });
        }
      }
    }

    //compute total server-side
    order.total = size.price + totalIngredientsPrice;

    //insert order into DB
    const orderId = await dao.createOrder(order, userId);

    //insert ingredients into DB
    for (let ingredientName of order.ingredients) {
      let ingredient = await dao.getIngredientByName(ingredientName);//first get the ingredient object by name
      await dao.addOrderIngredient(orderId, ingredient.id);

      //update availability
      if (ingredient.limited) {
        await dao.updateIngredientAvailability(ingredient.id, ingredient.quantity - 1);
      }
    }

    return res.status(201).json({
      message: 'Order successfully submitted.',
      orderId,
      computedTotal: order.total.toFixed(2)
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//Delete an order from DB
app.delete('/api/orders/:id', isLoggedIn, isTotp, [
  check("id").isInt({ min: 1 })
], async (req, res) => {

  // Is there any validation error?
  const errors = validationResult(req).formatWith(errorFormatter); // format error message
  if (!errors.isEmpty()) {
    return res.status(422).json(errors.errors); // error message is sent back as a json with the error info
  }

  const orderId = req.params.id;
  const userId = req.user.id;

  try {
    //check if order exists in DB
    const order = await dao.getOrderById(orderId, userId);
    if (!order || order.error) { //in case of errors, promise resolves to an object with an "error" field
      return res.status(400).json({ error: `Order ${orderId} not found for current user.` });
    }
    //get order ingredients ids
    const ingredientsIds = await dao.getOrderIngredients(order.id);

    //get all order ingredients objects
    const orderIngredients = await Promise.all(
      ingredientsIds.map(async (id) => {
        const ingredient = await dao.getIngredient(id);
        return ingredient;
      })
    );
    //update availability
    for (let ingredient of orderIngredients) {
      if (ingredient.limited) {
        await dao.updateIngredientAvailability(ingredient.id, ingredient.quantity + 1);
      }
    }
    //delete order from DB
    const deletedId = await dao.deleteOrder(orderId, userId);

    return res.status(200).json({
      message: 'Order successfully deleted.',
      deletedId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//USERS APIs

function clientUserInfo(req) {
  const user = req.user;
  return { id: user.id, username: user.username, name: user.name, canDoTotp: user.secret ? true : false, isTotp: req.session.method === 'totp' };
}

// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json({ error: info });
    }
    // success, perform the login and extablish a login session
    req.login(user, (err) => {
      if (err)
        return next(err);
      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser() in LocalStratecy Verify Fn
      return res.json(clientUserInfo(req));
    });
  })(req, res, next);
});

// This route is used for performing 2FA.
app.post('/api/login-totp', isLoggedIn,
  passport.authenticate('totp'),   // passport expect the totp value to be in: body.code
  function (req, res) {
    req.session.method = 'totp';
    res.json({ otp: 'authorized' });
  }
);

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(clientUserInfo(req));
  }
  else
    res.status(401).json({ error: 'Not authenticated' });
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

// activate the server
app.listen(port, (err) => {
  if (err)
    console.log(err);
  else
    console.log(`Server listening at http://localhost:${port}`);
}); 
