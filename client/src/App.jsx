import { useState, useEffect } from 'react'
import { Container, Row, Alert } from 'react-bootstrap';
import { Routes, Route, Navigate } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Header from './components/Header';
import API from './API.js';
import { LoginLayout, TotpLayout } from './components/Authentication'
import { MainPageLayout, NewOrderPageLayout, PastOrdersPageLayout } from './components/Layout.jsx'


function App() {
  //initialize states of chosenDish and chosenSize
  const initialDish = { label: 'empty', id: 'dish-empty' };
  const initialSize = { label: 'empty', id: 'size-empty', price: 0, maxIngredients: 0 };

  //authentication states
  const [user, setUser] = useState(null);//this state contains the user's info.
  const [loggedIn, setLoggedIn] = useState(false);//this state keeps track if the user is currently logged-in.
  const [loggedInTotp, setLoggedInTotp] = useState(false);
  //general states
  const [dishes, setDishes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [ingredients, setIngredients] = useState([]);//State with all ingredients
  //user specific states
  const [chosenDish, setChosenDish] = useState(initialDish);
  const [chosenSize, setChosenSize] = useState(initialSize);
  const [maxIngredients, setMaxIngredients] = useState(0);
  const [orderIngredients, setOrderIngredients] = useState([]);//state with current order ingredients
  const [ordersList, setOrdersList] = useState([]);
  //service states
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [waiting, setWaiting] = useState(false); //used to load a spinner when client is loading data from server
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        //get user info
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
        if (user.isTotp)
          setLoggedInTotp(true);
      } catch (err) {
        // NO need to do anything: user is simply not yet authenticated
      }
    };
    checkAuth();
  }, []);  // This useEffect callback is called only the first time the component is mounted.


  useEffect(() => {
    setWaiting(true);

    Promise.all( // I use promise all so that waiting state and dirty state are set to false only after completing all the API queries
      [
        API.getAllIngredients()
          .then(ingredients => {
            setIngredients(ingredients);
            //load the updated version of every ingredient already in the order from the server 
            //(needed in case of order submit failure due to unavailability of ingredients or other reasons)
            for (let i = 0; i < orderIngredients.length; i++) {
              for (let j = 0; j < ingredients.length; j++) {
                if (orderIngredients[i].id == ingredients[j].id) {
                  orderIngredients[i] = ingredients[j];
                }
              }
            }
          })
          .catch(e => handleErrors(e)),

        API.getAllDishes()
          .then(dishes => setDishes(dishes))
          .catch(e => handleErrors(e)),

        API.getAllSizes()
          .then(sizes => setSizes(sizes))
          .catch(e => handleErrors(e)),
      ]
    ).finally(() => {
      setWaiting(false);
      setDirty(false);
    })

  }, [dirty]); //Ingredients, sizes, dishes and orders are retrieved when i first load the page and if a add or delete an order or if i move from or to orders page

  //If an error occurs, the error message will be shown in an alert
  const handleErrors = (err) => {
    let msg = "";
    if (err.error) {
      msg = err.error;
    } else {
      msg = "Unknown Error";
    }
    setErrorMsg(msg);

    if (msg === 'Not authenticated') { //returned in case of failed GET of current session
      setTimeout(() => {  // do logout in the app state
        setUser(null); setLoggedIn(false); setLoggedInTotp(false); setDirty(true);
      }, 2000);
    } else {
      setTimeout(() => setDirty(true), 1000);  // Fetch the current version from server, after a while
    }

    console.log(err);
    return;
  }


  //This function handles the login process.
  //It requires a username and a password inside a "credentials" object.

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };


  //This function handles the logout process.

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setLoggedInTotp(false);

    // clean up everything
    setUser(null);
    setChosenDish(initialDish);
    setChosenSize(initialSize);
    setOrderIngredients([]);
    setMaxIngredients(0);
    setOrdersList([]);
    setErrorMsg(null);
    setSuccessMsg(null);
    setDirty(true);
  };


  const chooseDish = (dish) => {
    setChosenDish(dish);
  }

  const chooseSize = (size) => {
    //checks if size change is possible
    if (orderIngredients.length > size.maxIngredients) {
      setErrorMsg("Too many ingredients selected for size: " + size.label);
    } else {
      setChosenSize(size);
      setMaxIngredients(size.maxIngredients);
    }
  }
  //callback to set dirty state
  const setDirtyCallback = (dirty) => {
    setDirty(dirty);
  }
  //callback to set OrdersList
  const setOrdersListCallback = (orders) => {
    setOrdersList(orders);
  }
  //callback to reset order states in case "reset order" button is pressed during order configuration
  const resetOrder = () => {
    setChosenDish(initialDish);
    setChosenSize(initialSize);
    setMaxIngredients(0);
    setOrderIngredients([]);
  }

  //this function adds an ingredient to an order after performing all the necesary checkings
  const addOrderIngredient = (ingredient) => {
    //check if ingredient is already selected
    if (orderIngredients.some(i => i.name === ingredient.name)) {//.some() checks if at least one element of array matches a condition. "i" is the current element
      //say that ingredient has been already selected
      setErrorMsg("Ingredient already selected!")
      return;
    }
    //check for availability before adding ingredient
    if (ingredient.limited && ingredient.quantity == 0) { //if quantity is zero
      setErrorMsg("Ingredient " + ingredient.name + " is not available!");
      return;
    }
    //check incompatibilities
    for (let i = 0; i < orderIngredients.length; i++) {
      //see if ingredient is in the incompatibility list of other ingredients in the order
      if (orderIngredients[i].incompatible.includes(ingredient.name)) {//includes checks if ingredient.name is in the list of incompatibilities
        //say that ingredient is incompatible with current order
        setErrorMsg("Ingredient " + ingredient.name + " is incompatible with " + orderIngredients[i].name + " !")
        return;
      }
    }
    for (let i = 0; i < orderIngredients.length; i++) {
      //see if incompatibilities list of element includes ingredients already in the order
      if (ingredient.incompatible.includes(orderIngredients[i].name)) {
        //say that ingredient is incompatible with current order
        setErrorMsg("Ingredient " + ingredient.name + " is incompatible with " + orderIngredients[i].name + " !")
        return;
      }
    }
    //check if max ingredients is reached
    if (orderIngredients.length == maxIngredients) {
      setErrorMsg("You reached the maximum number of ingredients (" + maxIngredients + ") for a " + chosenSize.label + " dish!")
      return;
    }
    const orderIngredientsNames = orderIngredients.map(i => i.name); //get list of ingredient names already in the dish
    //check for requirements
    for (let i = 0; i < ingredient.required.length; i++) {
      //see if requirements of the element I want to add are already in the dish
      if (!orderIngredientsNames.includes(ingredient.required[i])) {
        //if not, say that ingredient requires another one
        setErrorMsg("Ingredient " + ingredient.name + " requires " + ingredient.required[i] + " !")
        return;
      }
    }

    //if no errors arise -> add element
    const newIngredients = orderIngredients.concat(ingredient)
    setOrderIngredients(newIngredients);
  }
  
  //removes an ingredient from the order if requirements allow it
  const removeOrderIngredient = (ingredient) => {
    for (let i = 0; i < orderIngredients.length; i++) {
      //see if any element of the order requires this ingredient
      if (orderIngredients[i].required.includes(ingredient.name)) {
        //if yes, ingredient cannot be removed
        setErrorMsg("This ingredient is required by " + orderIngredients[i].name + " !")
        return;
      }
    }

    //if no errors arise -> remove element
    const newIngredients = orderIngredients.filter(i => i.name != ingredient.name) //any element whose name is different from ingredient.name is kept
    setOrderIngredients(newIngredients);
  }

  //submits an order to the server after performing some checks
  const submitOrder = () => {
    //add availability check
    for (let i = 0; i < orderIngredients.length; i++) {
      const currentIngredient = ingredients.find(ing => ing.id === orderIngredients[i].id); //finds the ingredient object corresponding to element in my order
      if (currentIngredient.limited && currentIngredient.quantity == 0) { //if quantity is zero
        setErrorMsg("Ingredient " + currentIngredient.name + " is not available!");
        return;
      }
    }
    //check if a dish and a size is selected
    if (chosenDish.id == "dish-empty") {
      setErrorMsg("You must select a dish!");
      return;
    }
    if (chosenSize.id == "size-empty") {
      setErrorMsg("You must select a size!");
      return;
    }
    //obtain array of ingredients names
    const orderIngredientsNames = orderIngredients.map(i => i.name);

    const order = { dish: chosenDish.id, size: chosenSize.id, ingredients: orderIngredientsNames }

    //if no errors arise -> add order
    API.createOrder(order)
      .then(() => {
        setDirty(true);
        setSuccessMsg("Order successfully submitted.");
        //then clear current order (only on order confirmation, to allow modifications in case order submission fails)
        setOrderIngredients([]);
        setChosenDish(initialDish);
        setChosenSize(initialSize);
        setMaxIngredients(0);
      })
      .catch(err => handleErrors(err));

  }

  //cancels an order from the server
  const cancelOrder = (orderId) => {
    API.deleteOrder(orderId)
      .then(() => {
        setDirty(true);
        setSuccessMsg("Order successfully cancelled.");
      })
      .catch(err => handleErrors(err));
  }

  return (
    <Container fluid>
      {successMsg && (
        <div className="mb-3">
          <Alert variant="success" onClose={() => setSuccessMsg(null)} dismissible>
            {successMsg}
          </Alert>
        </div>
      )}
      {errorMsg && (
        <div className="mb-3">
          <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>
            {errorMsg}
          </Alert>
        </div>
      )}
      <Row>
        <Header addOrder={submitOrder} chosenSize={chosenSize} chosenDish={chosenDish} orderIngredients={orderIngredients} setDirty={setDirtyCallback}
          loggedIn={loggedIn} user={user} loggedInTotp={loggedInTotp} logout={handleLogout} resetOrder={resetOrder} />
      </Row>
      <Routes>
        <Route path="*" element={
          <div>Error 404 - Not Found</div>
        } />
        <Route path='/login' element={
          <LoginWithTotp loggedIn={loggedIn} login={handleLogin} user={user} setLoggedInTotp={setLoggedInTotp} />
        } />
        <Route path="/" element={
          <MainPageLayout sizes={sizes} dishes={dishes} ingredients={ingredients} loading={waiting} />
        } />
        <Route path="/new-order" element={
          <NewOrderPageLayout chooseDish={chooseDish} chooseSize={chooseSize} sizes={sizes} dishes={dishes} chosenDish={chosenDish} chosenSize={chosenSize}
            loading={waiting} ingredients={ingredients} add={addOrderIngredient} loggedIn={loggedIn} orderIngredients={orderIngredients} remove={removeOrderIngredient} />
        } />
        <Route path="/past-orders" element={
          <PastOrdersPageLayout loggedIn={loggedIn} orders={ordersList} cancel={cancelOrder} loggedInTotp={loggedInTotp}
            dirty={dirty} setDirty={setDirtyCallback} setOrdersList={setOrdersListCallback} handleErrors={handleErrors} />
        } />
      </Routes>
    </Container>
  )
}

function LoginWithTotp(props) {
  if (props.loggedIn) {
    if (props.user.canDoTotp) {
      if (props.loggedInTotp) {
        return <Navigate replace to='/' />;
      } else {
        return <TotpLayout totpSuccessful={() => props.setLoggedInTotp(true)} />;
      }
    } else {
      return <Navigate replace to='/' />;
    }
  } else {
    return <LoginLayout login={props.login} />;
  }
}

export default App
