import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';


export default function PickingCard(props) {

    const [cardState, setCardState] = useState({
        color: 'white',
        butt: 'Pickear'
    })

    const handleClick = () => {
        if (cardState.butt === 'Pickear') {
            setCardState({
                color: '#00e5ff',
                butt: 'Soltar'
            })
        } else {
            setCardState({
                color: 'white',
                butt: 'Pickear'
            })
        }
    }

    return (
        <Card elevation={3} sx={{ maxWidth: 400, backgroundColor: cardState.color }}>
            <CardMedia
                component="img"
                height="200"
                image={props.productToCard.image_link}
                alt=""
            />
            <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                    {props.productToCard.name}
                </Typography>
                <Typography gutterBottom variant="subtitle1" component="div">
                    {props.productToCard.quantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {props.productToCard.sku}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {props.productToCard.barcode}
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small" onClick={handleClick}>{cardState.butt}</Button>
            </CardActions>
        </Card>
    );
}
