import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePageMeta } from "@/hooks/use-page-meta";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Rates from "@/pages/Rates";
import Gallery from "@/pages/Gallery";
import Contact from "@/pages/Contact";
import BookingPage from "@/pages/Booking";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CookiePolicy from "@/pages/CookiePolicy";

function Router() {
  const [location] = useLocation();
  usePageMeta(location);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/rates" component={Rates} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/contact" component={Contact} />
      <Route path="/booking" component={BookingPage} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={Admin} />
      <Route path="/politique-de-confidentialite" component={PrivacyPolicy} />
      <Route path="/politique-de-cookies" component={CookiePolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
