import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { register, handleSubmit, reset } = useForm();
  const { toast } = useToast();

  const onSubmit = (data: any) => {
    console.log(data);
    toast({
      title: "Request Sent",
      description: "We will contact you shortly to confirm your booking.",
    });
    reset();
  };

  return (
    <Layout>
      <div className="bg-foreground text-background py-24 pt-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 uppercase">Contact Us</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto font-sans">
            Book your tee time or get in touch with our team.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Form */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-heading font-bold mb-4 uppercase">Make a Request</h2>
              <p className="text-muted-foreground font-sans">Fill out this form and we'll get back to you to confirm availability.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="uppercase font-bold text-xs tracking-wider">Full Name</Label>
                  <Input id="name" placeholder="John Doe" {...register("name")} className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="uppercase font-bold text-xs tracking-wider">Phone</Label>
                  <Input id="phone" placeholder="(450) 123-4567" {...register("phone")} className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="uppercase font-bold text-xs tracking-wider">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" {...register("email")} className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="uppercase font-bold text-xs tracking-wider">Date</Label>
                  <Input id="date" type="date" {...register("date")} className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="players" className="uppercase font-bold text-xs tracking-wider">Players</Label>
                  <Select>
                    <SelectTrigger className="rounded-none border-foreground/20 h-12 bg-transparent">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Player</SelectItem>
                      <SelectItem value="2">2 Players</SelectItem>
                      <SelectItem value="3">3 Players</SelectItem>
                      <SelectItem value="4">4 Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="uppercase font-bold text-xs tracking-wider">Notes</Label>
                <Textarea id="message" placeholder="Any special requests?" className="min-h-[120px] rounded-none border-foreground/20 focus:border-primary bg-transparent" {...register("message")} />
              </div>

              <Button type="submit" className="w-full rounded-full h-14 text-sm font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white">
                Send Request
              </Button>
            </form>
          </div>

          {/* Info & Map */}
          <div className="space-y-8">
            <Card className="bg-[#EAE6D9] border-none rounded-none">
              <CardContent className="p-8 space-y-6">
                <h3 className="font-heading font-bold text-2xl mb-6 uppercase">Information</h3>
                
                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">Address</h4>
                    <p className="text-muted-foreground font-sans text-sm">123 Rue du Golf<br/>Sorel-Tracy, QC J3P 1A1</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">Phone</h4>
                    <p className="text-muted-foreground font-sans text-sm">(450) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">Email</h4>
                    <p className="text-muted-foreground font-sans text-sm">info@golfsimst.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">Hours</h4>
                    <p className="text-muted-foreground text-sm font-sans">
                      <span className="block font-medium text-foreground">Members:</span> 24/7 Access
                    </p>
                    <p className="text-muted-foreground text-sm mt-1 font-sans">
                      <span className="block font-medium text-foreground">Visitors:</span>
                      Mon - Sun: 10am - 10pm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <div className="w-full h-[300px] bg-muted overflow-hidden relative">
               <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                  <p className="text-muted-foreground font-heading uppercase font-bold tracking-wider">Google Maps</p>
               </div>
               <iframe 
                 width="100%" 
                 height="100%" 
                 style={{border:0}} 
                 loading="lazy"
                 className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44567.54741301245!2d-73.15000000000001!3d46.0333333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cc8600000000001%3A0x0!2sSorel-Tracy%2C%20QC!5e0!3m2!1sen!2sca!4v1620000000000!5m2!1sen!2sca"
               ></iframe>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
