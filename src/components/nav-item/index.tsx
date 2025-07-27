import { NavLink } from "react-router-dom"
import { usePageTitle } from "@/contexts/PageTitleContext";

interface NavItemProps {
  to: string
  label: string
}

export default function NavItem({ to, label }: NavItemProps) {
  const { setTitle } = usePageTitle()


  return (
    <NavLink
      to={to}
      onClick={() => setTitle(label)}
      className={({ isActive }) =>
        `flex items-center w-full px-4 py-2 hover:bg-blue-800 text-white ${isActive ? "bg-blue-800 font-semibold" : ""
        }`
      }
    >
      <span>{label}</span>
    </NavLink>
  )
}
