import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Table, Spinner } from 'react-bootstrap';

function ChosenIngredientsList(props) {
    if (props.loading) {
        return ( //if page is loading, display a loading animation
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
                        <th>Ingredient</th>
                        <th>Price</th>
                        <th>Availability</th>
                        <th>Requirements</th>
                        <th>Incompatibilities</th>
                        <th></th>
                        {//last column empty to leave space for the remove button
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        props.orderIngredients.map((ingredient) => <IngredientRow ingredientObj={ingredient}
                            key={ingredient.name}
                            remove={props.remove}
                        />)
                    }
                </tbody>
            </Table>
        )
    }

}

function IngredientRow(props) {

    const ingredient = {
        id: props.ingredientObj.id,
        name: props.ingredientObj.name,
        price: props.ingredientObj.price,
        limited: props.ingredientObj.limited,
        quantity: props.ingredientObj.quantity,
        required: props.ingredientObj.required,
        incompatible: props.ingredientObj.incompatible
    }
    return (
        <tr>
            <td>
                <p>{ingredient.name}</p>
            </td>
            <td>
                <p>{"+ " + ingredient.price.toFixed(2) + " €"}</p>
            </td>
            <td>
                <Quantity limited={ingredient.limited} quantity={ingredient.quantity} />
            </td>
            <td>
                <Constraints constraints={ingredient.required} />
            </td>
            <td>
                <Constraints constraints={ingredient.incompatible} />
            </td>
            <td>
                <Button onClick={() => {
                    props.remove(ingredient)
                }}>
                    <i className="bi bi-trash" />
                </Button>
            </td>

        </tr>
    )
}

function Quantity(props) {
    let output = ""
    if (props.limited) {
        output = "" + props.quantity;
    } else {
        output = "unlimited"
    }
    return (
        <p>{output}</p>
    )
}

function Constraints(props) {//prints required and incompatible lists
    let output = ""
    for (let i = 0; i < props.constraints.length; i++) {
        if (i != 0) {
            output += ", "
        }
        output += props.constraints[i]
    }
    return (
        <p>{output}</p>
    )
}


export default ChosenIngredientsList;