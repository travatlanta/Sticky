import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Editor from "@/pages/Editor";
import Cart from "@/pages/Cart";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Deals from "@/pages/Deals";
import Account from "@/pages/Account";
import Designs from "@/pages/Designs";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import AdminDeals from "@/pages/admin/Deals";
import AdminPromotions from "@/pages/admin/Promotions";
import AdminSettings from "@/pages/admin/Settings";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {() => (
          <Layout>
            {isAuthenticated ? <Home /> : <Landing />}
          </Layout>
        )}
      </Route>
      <Route path="/products">
        {() => (
          <Layout>
            <Products />
          </Layout>
        )}
      </Route>
      <Route path="/products/:slug">
        {() => (
          <Layout>
            <ProductDetail />
          </Layout>
        )}
      </Route>
      <Route path="/editor/:designId?">
        {() => (
          <Layout showFooter={false}>
            <Editor />
          </Layout>
        )}
      </Route>
      <Route path="/cart">
        {() => (
          <Layout>
            <Cart />
          </Layout>
        )}
      </Route>
      <Route path="/orders">
        {() => (
          <Layout>
            <Orders />
          </Layout>
        )}
      </Route>
      <Route path="/deals">
        {() => (
          <Layout>
            <Deals />
          </Layout>
        )}
      </Route>
      <Route path="/account">
        {() => (
          <Layout>
            <Account />
          </Layout>
        )}
      </Route>
      <Route path="/designs">
        {() => (
          <Layout>
            <Designs />
          </Layout>
        )}
      </Route>
      <Route path="/orders/:id">
        {() => (
          <Layout>
            <OrderDetail />
          </Layout>
        )}
      </Route>
      <Route path="/admin">{() => <AdminRoute component={AdminDashboard} />}</Route>
      <Route path="/admin/products">{() => <AdminRoute component={AdminProducts} />}</Route>
      <Route path="/admin/orders">{() => <AdminRoute component={AdminOrders} />}</Route>
      <Route path="/admin/deals">{() => <AdminRoute component={AdminDeals} />}</Route>
      <Route path="/admin/promotions">{() => <AdminRoute component={AdminPromotions} />}</Route>
      <Route path="/admin/settings">{() => <AdminRoute component={AdminSettings} />}</Route>
      <Route>
        {() => (
          <Layout>
            <NotFound />
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <>
      <ScrollRestoration />
      <Router />
      <Toaster />
    </>
  );
}
