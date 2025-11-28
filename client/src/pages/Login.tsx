import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

async function login(credentials: { username: string; password: string }) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Erreur de connexion");
  }
  return data;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      toast({ title: "Connexion réussie" });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-[#F7F3E8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="bg-[#1B1A18] text-[#F7F3E8] rounded-t-lg">
          <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
            <Lock className="w-5 h-5" />
            Administration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="uppercase text-xs font-bold tracking-wider text-foreground/70">
                Nom d'utilisateur
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12"
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="uppercase text-xs font-bold tracking-wider text-foreground/70">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[#2B5734] hover:bg-[#2B5734]/90 text-white font-bold uppercase tracking-wider"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
