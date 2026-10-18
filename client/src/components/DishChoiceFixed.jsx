import 'bootstrap/dist/css/bootstrap.min.css';
import { ListGroup, Spinner } from 'react-bootstrap';

function DishChoiceFixed(props) { //used to diplay non-interactive list of dishes to display in the home page
    const dishes = props.dishes;
    const sizes = props.sizes;

    if (props.loading) {
        return ( //if page is loading, display a loading animation
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <Spinner />
            </div>
        )
    }
    else {
        return (
            <>
                <h5 className="text-primary fw-bold">Available Dishes</h5>
                <ListGroup className="my-2">
                    {
                        dishes.map((dish) => {
                            return (
                                <ListGroup.Item key={dish.id}> {dish.label} </ListGroup.Item>
                            );
                        })
                    }
                </ListGroup>
                <h5 className="text-primary fw-bold">Available Sizes</h5>
                <ListGroup className="my-2">
                    {
                        sizes.map((size) => {
                            return (
                                <ListGroup.Item key={size.id}> {size.label + " " + size.price + "€" + "   (max "+ size.maxIngredients +" ingredients)"} </ListGroup.Item>
                            );
                        })
                    }
                </ListGroup>

            </>
        )
    }
}

export default DishChoiceFixed;