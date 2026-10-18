import 'bootstrap/dist/css/bootstrap.min.css';
import { ListGroup, Spinner } from 'react-bootstrap';

function DishChoice(props) {
    const dishes = props.dishes;
    const sizes = props.sizes;
    const chosenDish = props.chosenDish;
    const chosenSize = props.chosenSize;



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
                                <ListGroup.Item
                                    key={dish.id}
                                    active={chosenDish.id == dish.id}
                                    onClick={() => {
                                        props.chooseDish(dish);
                                    }}>
                                    {dish.label}
                                </ListGroup.Item>


                            );
                        })
                    }
                </ListGroup>
                <h5 className="text-primary fw-bold">Available Sizes</h5>
                <ListGroup className="my-2">
                    {
                        sizes.map((size) => {
                            return (
                                <ListGroup.Item
                                    key={size.id}
                                    active={chosenSize.id == size.id}
                                    onClick={() => {
                                        props.chooseSize(size);
                                    }}>
                                    {size.label + " " + size.price + "€"+"   (max "+ size.maxIngredients +" ingredients)"}
                                </ListGroup.Item>


                            );
                        })
                    }
                </ListGroup>

            </>
        )
    }
}

export default DishChoice;