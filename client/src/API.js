const URL = 'http://localhost:3001/api';

//function to parse server responses
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise.then((response) => {
      if (response.ok) {
        // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
        response.json().then(json => resolve(json)).catch(err => reject({ error: "Cannot parse server response" }))

      } else {
        // analyzing the cause of error
        response.json().then(obj => reject(obj)).catch(err => reject({ error: "Cannot parse server response" }))
      }
    }).catch(err => reject({ error: "Cannot communicate" })
    ) // connection error
  });
}

//All these functions return promises!

//Gets all ingredients with requirements and incompatibilities from DB
async function getAllIngredients() {
  const responsePromise = fetch(URL + `/ingredients`);
  return getJson(responsePromise);
}
//Gets all dishes available in the restaurtant
async function getAllDishes() {
  const responsePromise = fetch(URL + `/dishes`);
  return getJson(responsePromise);
}
//Gets all sizes available in the restaurtant
async function getAllSizes() {
  const responsePromise = fetch(URL + `/sizes`);
  return getJson(responsePromise);
}
//Gets all orders made by current user
async function getAllOrders() {
  const responsePromise = fetch(URL + `/orders`, {
    credentials: 'include'
  });
  return getJson(responsePromise);
}
//Submits a new order to the server
async function createOrder(order) {
  const responsePromise = fetch(URL + `/orders`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order)
  })
  return getJson(responsePromise);
}
//Deletes an order from the DB
function deleteOrder(orderId) {
  const responsePromise = fetch(URL + `/orders/${orderId}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  return getJson(responsePromise);
}

//AUTHENTICATION APIs

//This function receives the TOTP code and executes 2FA
const totpVerify = async (totpCode) => {
  const responsePromise = fetch(URL + '/login-totp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
    body: JSON.stringify({code: totpCode}),
  })
  return getJson(responsePromise)
};

//This function wants username and password inside a "credentials" object. It executes the log-in.
const logIn = async (credentials) => {
  const responsePromise = fetch(URL + '/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
    body: JSON.stringify(credentials),
  })
  return getJson(responsePromise)
};


//This function is used to verify if the user is still logged-in. It returns a JSON object with the user info.
const getUserInfo = async () => {
  const responsePromise = fetch(URL + '/sessions/current', {
    // this parameter specifies that authentication cookie must be forwarded
    credentials: 'include'
  })
  return getJson(responsePromise)
};


//This function destroy the current user's session and execute the log-out.
const logOut = async() => {
  const responsePromise = fetch(URL + '/sessions/current', {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
  })
  return getJson(responsePromise)
}

const API = { getAllIngredients, getAllDishes, getAllSizes, getAllOrders, createOrder, deleteOrder, totpVerify, logIn, getUserInfo, logOut }
export default API;