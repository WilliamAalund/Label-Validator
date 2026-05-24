import AppHeader from "./AppHeader";
import { Outlet } from "react-router";

const AppLayout = () => {
    return (
        <div>
            <AppHeader />
            <Outlet />
        </div>
    );
};

export default AppLayout;