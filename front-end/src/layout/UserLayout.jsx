import { Outlet, useLocation } from "react-router-dom";
import TabBar from "../user-native/TabBar";
import SideNav from "../user-native/SideNav";
import { UnsavedChangesProvider } from "../context/UnsavedChangesContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Screens that sit outside the native tab navigator (no bottom tab bar)
const NO_TAB_BAR = [/^\/notifications(\/|$)/];

function UserLayout() {
  const { pathname } = useLocation();
  const showTabBar = !NO_TAB_BAR.some((re) => re.test(pathname));

  return (
    <div className="native-ui">
      <UnsavedChangesProvider>
        <ToastContainer
          position="top-right"
          autoClose={1500}
          toastStyle={{
            width: "100%",
          }}
        />

        {/* Each screen draws its own header (AppHeader / StackHeader), like the native app */}
        {/* Mobile / tablet: native bottom tab bar. Desktop (lg+): fixed side navigation + wider column */}
        <SideNav />
        <div className="user-shell lg:ml-60">
          <div
            className={`user-column max-w-3xl lg:max-w-none mx-auto w-full ${showTabBar ? "pb-[70px] lg:pb-0" : ""}`}
          >
            <Outlet />
          </div>
        </div>

        {showTabBar && (
          <div className="lg:hidden">
            <TabBar />
          </div>
        )}
      </UnsavedChangesProvider>
    </div>
  );
}

export default UserLayout;
