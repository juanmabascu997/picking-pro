import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { useEffect } from 'react';
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { validRoute } from '../utils/APIRoutes';

const CookieVerification = () => {

    const navigate = useNavigate();

    const verifyUser = async () => {
        const userdata = await JSON.parse(localStorage.getItem("userData"));
        if (!userdata) {
            navigate("/login");
        } else {
            const { data } = await axios.post(
                validRoute,
                { mydata: userdata.token },
                {
                    withCredentials: true,
                }
            );
            
            if (!data.status) {
                localStorage.removeItem("userData");
                navigate("/login");
            }/* else
                toast(`Hola ${data.user} 🦄`, {
                    theme: "dark",
                }); */
        }
    };

    useEffect(() => {
        verifyUser();
    }, []);

    const logOut = () => {
        localStorage.removeItem("userData");
        navigate("/login");
    };

    return <ToastContainer />;
}

export default CookieVerification