import { Outlet } from "react-router-dom";
import Header from "@/components/header";
import Dashboard from "@/components/dashboard";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function MainLayout() {
  const collapsed = useSelector((state: RootState) => state.layout.collapsed);

  return (
    <>
      <Header />
      <div className={`flex pt-[70px]`}>
        <div className={`transition-all duration-300 ${collapsed ? "w-[80px]" : "w-[250px]"}`}>
          <Dashboard />
        </div>
        <div className="flex-1 transition-all duration-300 overflow-hidden">
          <div className="main-content">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
