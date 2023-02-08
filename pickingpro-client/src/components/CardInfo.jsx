import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Avatar, Card, CardContent, Typography } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useEffect } from 'react';
import { dashboardData } from "../utils/APIRoutes";
import axios from 'axios';
import { useState } from 'react';

export default function CardInfo() {

    const [cardData, setCardData] = useState({});

    const getDashboardData = async () => {
        try {
            const myUser = await JSON.parse(localStorage.getItem("userData"));
            const { data } = await axios.get(dashboardData, {
                params: myUser
            });
            if (data.err)
                console.log(data.err);
            else
                setCardData(data);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getDashboardData();
    }, [])

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <Card>
                        <CardContent>
                            <Grid
                                container
                                spacing={3}
                                sx={{ justifyContent: 'space-between' }}
                            >
                                <Grid item xs={8}>
                                    <Typography
                                        variant="overline"
                                    >
                                        A Pickear
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                    >
                                        {cardData.orders_to_pick}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Avatar
                                        sx={{
                                            backgroundColor: 'blue',
                                            height: 56,
                                            width: 56
                                        }}
                                    >
                                        <AddShoppingCartIcon sx={{height: 40, width: 40}} />
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={4}>
                    <Card>
                        <CardContent>
                            <Grid
                                container
                                spacing={3}
                                sx={{ justifyContent: 'space-between' }}
                            >
                                <Grid item xs={8}>
                                    <Typography
                                        variant="overline"
                                    >
                                        Tus pendientes
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                    >
                                        {cardData.pending_orders}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Avatar
                                        sx={{
                                            backgroundColor: 'green',
                                            height: 56,
                                            width: 56
                                        }}
                                    >
                                        <ArchiveIcon sx={{height: 40, width: 40}} />
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={4}>
                    <Card>
                        <CardContent>
                            <Grid
                                container
                                spacing={3}
                                sx={{ justifyContent: 'space-between' }}
                            >
                                <Grid item xs={8}>
                                    <Typography
                                        variant="overline"
                                    >
                                        Tus finalizados
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                    >
                                        {cardData.packed_orders_today}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Avatar
                                        sx={{
                                            backgroundColor: 'purple',
                                            height: 56,
                                            width: 56
                                        }}
                                    >
                                        <ChildCareIcon sx={{height: 40, width: 40}} />
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}