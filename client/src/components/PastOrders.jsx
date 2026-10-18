import 'bootstrap-icons/font/bootstrap-icons.css';
import { useState, useEffect } from 'react';
import { Button, Table, Spinner } from 'react-bootstrap';
import API from '../API.js';

function PastOrders(props) {

    const [waiting, setWaiting] = useState(true); //different waiting state, used for the getAllOrders() API call

    useEffect(() => {
        setWaiting(true);
        API.getAllOrders()
            .then(orders => {
                props.setOrdersList(orders); //updates the local ordersList state with the info got from server
                props.setDirty(false);
                setWaiting(false);
            })
            .catch(e => {
                props.handleErrors(e);
                props.setDirty(false);
                setWaiting(false);
            });

    }, [props.dirty]); //this useEffect loads the orders for current user from the DB every time state is set to dirty. API call must be here because requires authentication

    if (waiting) {
        return (  //if page is loading, display a loading animation
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <Spinner />
            </div>
        )
    }
    else {
        return (
            <Table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Dish</th>
                        <th>Size</th>
                        <th>Ingredients</th>
                        <th>Total</th>
                        <th></th>
                        {//last column empty to leave space for the "cancel" button
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        props.orders.map((order) =>
                            <OrderRow
                                orderObj={order}
                                key={order.id}
                                cancel={props.cancel}
                                loggedInTotp={props.loggedInTotp}
                            />)
                    }
                </tbody>
            </Table>
        )
    }

}

function OrderRow(props) {

    const order = {
        id: props.orderObj.id,
        dish: props.orderObj.dish,
        size: props.orderObj.size,
        ingredients: props.orderObj.ingredients,
        total: props.orderObj.total,
    }
    return (
        <tr>
            <td>
                <p>{"Order #" + order.id}</p>
            </td>
            <td>
                <p>{order.dish}</p>
            </td>
            <td>
                <p>{order.size}</p>
            </td>
            <td>
                <Ingredients ingredients={order.ingredients} />
            </td>
            <td>
                <p>{order.total.toFixed(2) + " €"}</p>
            </td>
            <td> {props.loggedInTotp ? //don't render button to cancel order if user is not authenticated with totp
                <Button onClick={() => { props.cancel(order.id) }}>
                    <strong>Cancel order</strong>
                </Button> : " "
            }

            </td>

        </tr>
    )
}

function Ingredients(props) {//prints list of ingredients of an order
    let output = ""
    for (let i = 0; i < props.ingredients.length; i++) {
        if (i != 0) {
            output += ", "
        }
        output += props.ingredients[i]
    }
    return (
        <p>{output}</p>
    )
}

export default PastOrders;