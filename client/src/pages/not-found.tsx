import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <Flag className="h-10 w-10 text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-serif font-medium">Hors Limites</h1>
        
        <p className="text-lg text-muted-foreground">
          Oups ! Il semble que cette page se soit perdue dans le bois. 
          Revenons sur le fairway.
        </p>

        <Link href="/">
          <Button className="rounded-full px-8 py-6 text-lg">
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}
