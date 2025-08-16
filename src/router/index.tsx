import type { AppDispatch } from "@/store";
import { fetchUser } from "@/store/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/contexts/ProtectedRoute";
import AlbumImages from "@/pages/albums/albumImages";
import Albums from "@/pages/albums/albums";
import LoginPage from "@/pages/auth/login";
import Authorization from "@/pages/authorization";
import Blogs from "@/pages/Blog";
import BlogNew from "@/pages/Blog/BlogNew";
import Review from "@/pages/Review";
import {
    BusRoutesPage,
    GuidesPage,
    HotelsPage,
    MotorbikesPage,
} from "@/pages/service";
import Bonnus from "@/pages/tours/Bonnus";
import Booking from "@/pages/tours/Booking";
import MainLayout from "@layouts/main-layout";
import {
    CreateDestination,
    DestinationCategory,
    Destinations,
    UpdateDestination,
} from "@pages/destinations";
import HomePage from "@pages/home";
import NotFound from "@pages/not-found";
import Profile from "@pages/profile";
import { CreateTour, TourCategory, Tours } from "@pages/tours";
import { CreateUser, Customer, Employee, UpdateUser } from "@pages/users";
import ProtectedRouteRole from "./ProtectedRoute";

export default function AppRoutes() {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(fetchUser());
    }, [dispatch]);

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route
                    path="authorization"
                    element={
                        <ProtectedRouteRole allowedRoles={["admin"]}>
                            <Authorization />
                        </ProtectedRouteRole>
                    }
                />
                <Route
                    path="user/employee"
                    element={
                        <ProtectedRouteRole allowedRoles={["admin"]}>
                            <Employee />
                        </ProtectedRouteRole>
                    }
                />
                <Route index element={<HomePage />} />
                {/* === USERS === */}
                <Route path="user/customer" element={<Customer />} />
                <Route path="user/create" element={<CreateUser />} />
                <Route path="user/update/:id" element={<UpdateUser />} />
                <Route path="profile" element={<Profile />} />
                {/* === TOURS === */}
                <Route path="tours" element={<Tours />} />
                <Route path="tours/category" element={<TourCategory />} />
                <Route path="tours/book" element={<Booking />} />
                <Route path="tours/bonnus" element={<Bonnus />} />
                <Route path="tour/create" element={<CreateTour />} />
                <Route path="tour/edit/:id" element={<CreateTour />} />
                {/* === DESTINATIONS === */}
                <Route path="destinations" element={<Destinations />} />
                <Route
                    path="destination/category"
                    element={<DestinationCategory />}
                />
                <Route
                    path="destination/create"
                    element={<CreateDestination />}
                />
                <Route
                    path="destination/edit/:id"
                    element={<UpdateDestination />}
                />
                {/* === ALBUMS === */}
                <Route path="albums" element={<Albums />} />
                <Route path="album-images" element={<AlbumImages />} />
                {/* === SERVICE === */}
                <Route path="guides" element={<GuidesPage />} />
                <Route path="motorbikes" element={<MotorbikesPage />} />
                <Route path="bus-routes" element={<BusRoutesPage />} />
                <Route path="hotels" element={<HotelsPage />} />

                {/* Review */}
                <Route path="reviews" element={<Review />} />
                {/* Blogs */}
                <Route path="blogs" element={<Blogs />} />
                <Route path="blogs/new" element={<BlogNew />} />
                <Route path="blogs/edit/:id" element={<BlogNew />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
