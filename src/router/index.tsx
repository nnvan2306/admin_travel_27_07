import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchUser } from "@/store/authSlice";

import MainLayout from "@layouts/main-layout";
import NotFound from "@pages/not-found";
import HomePage from "@pages/home";
import Profile from "@pages/profile";
import { Employee, Customer, CreateUser, UpdateUser } from "@pages/users";
import { Tours, TourCategory, CreateTour, UpdateTour } from "@pages/tours";
import { Destinations, DestinationCategory, CreateDestination, UpdateDestination } from "@pages/destinations";
import { BusRoutesPage, GuidesPage, HotelsPage, MotorbikesPage } from "@/pages/service";
import LoginPage from "@/pages/auth/login";
import Authorization from "@/pages/authorization";
import ProtectedRoute from "@/contexts/ProtectedRoute";
import ProtectedRouteRole from "./ProtectedRoute";
import Albums from "@/pages/albums/albums";
import AlbumImages from "@/pages/albums/albumImages";

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
        <Route path="tour/create" element={<CreateTour />} />
        <Route path="tour/edit/:id" element={<UpdateTour />} />
        {/* === DESTINATIONS === */}
        <Route path="destinations" element={<Destinations />} />
        <Route path="destination/category" element={<DestinationCategory />} />
        <Route path="destination/create" element={<CreateDestination />} />
        <Route path="destination/edit/:id" element={<UpdateDestination />} />
        {/* === ALBUMS === */}
        <Route path="albums" element={<Albums />} />
        <Route path="album-images" element={<AlbumImages />} />
        {/* === SERVICE === */}
        <Route path="guides" element={<GuidesPage />} />
        <Route path="motorbikes" element={<MotorbikesPage />} />
        <Route path="bus-routes" element={<BusRoutesPage />} />
        <Route path="hotels" element={<HotelsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
