"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Zap,
  ShoppingCart,
  ArrowRight,
  Check,
  Mail,
  Menu,
  X,
  Shield,
  Loader2,
  Search,
  Server,
  ChevronDown,
  UserCircle,
  ThumbsUp,
  ThumbsDown,
  CreditCard,
  TicketCheck,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PaymentModal } from "@/components/PaymentModal";
import { getSupabase } from "@/lib/supabase";

// Smooth scroll utility function - scrolls without changing URL
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// Shared FAQ items
const faqItems: { question: string; answer: React.ReactNode }[] = [
  {
    question: "How long does it take for my site to be built?",
    answer: "We value expedited services at GimmeASite. All sites are completed in up to five business days depending on complexity. However, some sites can even be delivered the next day!",
  },  {
    question: 'How does "temporary support" work?',
    answer: <>Included in our Upfront Plan is a temporary support period that lasts 6 months beginning from the billing date. Within that timeframe, you have access to accelerated response time for support questions, 3 revision credits, regular troubleshooting, and more. Following the conclusion of this period, your site will remain online, but we will no longer maintain its full-stack, unless you renew your support period at <a href="https://gimmeasite.com/tickets" className="text-primary hover:underline font-medium">https://gimmeasite.com/tickets</a>. However, you can still reach out to us via email with questions or concerns, as we are always available.</>,
  },
  {
    question: "What counts as a revision?",
    answer: (
      <div className="space-y-3">
        <p>When requesting a revision, you can ask for many reasonable edits to your site in one ticket submission. A different allowance of revisions are included in each Plan, and they must be made at <a href="https://gimmeasite.com/tickets" className="text-primary hover:underline font-medium">https://gimmeasite.com/tickets</a>. Requesting extra revisions (&ldquo;Revision Refill&rdquo;) beyond what your Plan includes, or redesigns (total makeovers of your site) may incur additional fees. If we incorrectly revise your site following a request, open another ticket under &ldquo;General Inquiry&rdquo;, and we may waive a revision of yours at our discretion.</p>
        <div className="pl-4 border-l-2 border-border/50">
          <p className="font-semibold text-foreground mb-1">Aren&rsquo;t revisions just a form of support (which is already included)?</p>
          <p>Support is an umbrella term for many different aspects of website maintenance; however, &ldquo;revisions&rdquo; are quantifiable, so we separate them as an independent amenity to avoid confusion.</p>
        </div>
      </div>
    ),
  },
  {
    question: "Do I need to pay separately for hosting?",
    answer: <>Nope! We handle domain registration entirely for you, as hosting comes included in all Plans offered by GimmeASite.</>,
  },
  {
    question: "Where do I manage my subscription?",
    answer: (
      <div className="space-y-3">
        <p>You can manage your subscription, update payment methods, and view invoices at <a href="https://gimmeasite.com/billing" className="text-primary hover:underline font-medium">https://gimmeasite.com/billing</a>.</p>
        <div className="pl-4 border-l-2 border-border/50">
          <p className="font-semibold text-foreground mb-1">How do I upgrade or downgrade my Plan?</p>
          <p>You cannot upgrade or downgrade your Plan in the Billing Portal, as GimmeASite does not offer fixed rates. You must do so by opening a ticket at <a href="https://gimmeasite.com/tickets" className="text-primary hover:underline font-medium">https://gimmeasite.com/tickets</a>.</p>
        </div>
      </div>
    ),
  },
  {
    question: "Where do I open a ticket?",
    answer: (
      <div className="space-y-3">
        <p>You can open a ticket at <a href="https://gimmeasite.com/tickets" className="text-primary hover:underline font-medium">https://gimmeasite.com/tickets</a>.</p>
        <div className="pl-4 border-l-2 border-border/50">
          <p className="font-semibold text-foreground mb-1">Is there a limit to how many tickets I can open?</p>
          <p>Nope! We are here to answer any questions or concerns you may have, no matter the frequency.</p>
        </div>
      </div>
    ),
  },
  {
    question: "How do I access my account?",
    answer: <>You can access your account at <a href="https://gimmeasite.com/account" className="text-primary hover:underline font-medium">https://gimmeasite.com/account</a>. There are no login credentials; only a Billing Portal for managing subscriptions and a Ticket page for opening tickets. Be mindful that your account is only created for you following your first payment.</>,
  },
];

// FAQ Section Component
function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="py-20 relative" style={{ scrollMarginTop: "88px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            In Case
            <br />
            <span className="gradient-text">You Were Confused</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">Find answers to your common questions below.</p>
        </div>
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isItemOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`bg-secondary/30 rounded-xl overflow-hidden border transition-colors ${
                  isItemOpen ? "border-primary/30" : "border-transparent hover:border-border/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isItemOpen}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
                >
                  <span className="font-semibold">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                      isItemOpen ? "rotate-180 text-primary" : "text-muted-foreground"
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isItemOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="text-sm text-muted-foreground px-4 pb-4">{item.answer}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Navigation Component
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDrop = (id: string) => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setOpenDropdown(id); };
  const closeDrop = () => { leaveTimer.current = setTimeout(() => setOpenDropdown(null), 180); };

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src="/favicon.svg" alt="GimmeASite" className="w-10 h-10" />
              <span className="text-xl font-bold tracking-tight">GimmeASite</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <div className="relative" onMouseEnter={() => openDrop("pricing")} onMouseLeave={closeDrop}>
                <button type="button" onClick={() => handleNavClick("pricing")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  Plans <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openDropdown === "pricing" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "pricing" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 py-1 overflow-hidden" onMouseEnter={() => openDrop("pricing")} onMouseLeave={closeDrop}>
                    {(["Upfront", "Monthly", "Hybrid", "Annual"] as const).map(item => (
                      <button key={item} type="button" className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        onClick={() => { handleNavClick("pricing"); setTimeout(() => window.dispatchEvent(new CustomEvent("highlightPlan", { detail: item })), 600); }}
                      >{item}</button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => handleNavClick("faq")} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
              <button type="button" onClick={() => handleNavClick("contact")} className="text-muted-foreground hover:text-foreground transition-colors">Contact</button>
            </div>

            <div className="hidden md:flex items-center gap-3 ml-auto">
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowAccountPopup(true)}
                aria-label="Account"
              >
                <UserCircle className="w-5 h-5" />
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => handleNavClick("contact")}>
                Get Your Free Draft
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <button
              type="button"
              className="md:hidden p-2 ml-auto"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-4">
              <button type="button" onClick={() => handleNavClick("pricing")} className="block py-2 text-muted-foreground hover:text-foreground w-full text-left">Plans</button>
              <button type="button" onClick={() => handleNavClick("faq")} className="block py-2 text-muted-foreground hover:text-foreground w-full text-left">FAQ</button>
              <button type="button" onClick={() => handleNavClick("contact")} className="block py-2 text-muted-foreground hover:text-foreground w-full text-left">Contact</button>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => { setIsOpen(false); setShowAccountPopup(true); }}>
                  <UserCircle className="w-4 h-4 mr-1" />
                  Account
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => handleNavClick("contact")}>Get Your Free Draft</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Account popup */}
      {showAccountPopup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAccountPopup(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Account</h3>
              </div>
              <button type="button" onClick={() => setShowAccountPopup(false)} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              <span className="font-medium text-foreground">Note:</span> An account is only created for you after your first payment is processed.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => { window.location.href = "https://gimmeasite.com/billing"; }}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center leading-tight">Billing Portal</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => { window.location.href = "https://gimmeasite.com/tickets"; }}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <TicketCheck className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center leading-tight">Open a Ticket</span>
              </button>
            </div>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowAccountPopup(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hero Section
function HeroSection() {
  const phrases = ["Stunning Websites", "Online Presences", "Brand Identities", "Project Designs"];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("Stunning Websites");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@font-face{font-family:'Inter';src:url('/fonts/Inter-Variable.ttf') format('truetype');font-weight:100 900;font-style:normal;font-display:swap}@keyframes heroBlink{0%,49%{opacity:1}50%,100%{opacity:0}}.hero-cursor{display:inline-block;animation:heroBlink 0.9s steps(1,end) infinite;margin-left:1px;color:#f97316!important;-webkit-text-fill-color:#f97316!important}";
    document.head.appendChild(style);
    return () => { if (document.head.contains(style)) document.head.removeChild(style); };
  }, []);

  // Typewriter effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const target = phrases[phraseIndex];
    if (!isDeleting && displayed === target) {
      const t = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(t);
    }
    if (isDeleting && displayed === "") {
      setPhraseIndex((phraseIndex + 1) % phrases.length);
      setIsDeleting(false);
      return;
    }
    const speed = isDeleting ? 45 : 85;
    const t = setTimeout(() => {
      setDisplayed(isDeleting ? displayed.slice(0, -1) : target.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [displayed, isDeleting, phraseIndex]);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 md:pt-32 overflow-hidden">

      <div className="max-w-7xl mx-auto px-6 py-4 md:py-12 relative z-10">
        <div className="text-center max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-8 mb-4 md:mb-8 text-xs md:text-sm text-muted-foreground animate-slideIn opacity-0 stagger-1">
            <div className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /><span>Proven Results</span></div>
            <div className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /><span>Expedited Delivery</span></div>
            <div className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /><span>Quality Guaranteed</span></div>
          </div>

          <h1 className="tracking-tight leading-[1.05] mb-4 md:mb-8 animate-slideIn opacity-0 stagger-2 transition-none" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 550, fontSize: "clamp(38px, 10vw, 80px)" }}>
            <span className="block">We Build</span>
            <span className="block" style={{ height: "1.1em", overflow: "hidden", whiteSpace: "nowrap" }}>
              <span className="gradient-text">{displayed}</span><span className="hero-cursor">|</span>
            </span>
            <span className="block">That Convert</span>
          </h1>

          <p className="text-sm md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-5 md:mb-10 leading-relaxed animate-slideIn opacity-0 stagger-3">
            Transform your business with a professional website that captures attention and drives results. Fast, affordable, and designed to grow with you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideIn opacity-0 stagger-4">
            <div className="animate-attention-bounce">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 animate-glow" onClick={() => scrollToSection("contact")}>
                Get Your Free Draft
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-16 mt-8 md:mt-16 animate-slideIn opacity-0 stagger-6 max-w-5xl mx-auto">
          {[
            { number: "250+", label: "Personal Templates" },
            { number: "97%", label: "Customer Satisfaction" },
            { number: "∞", label: "Creative Opportunities" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="h-12 md:h-20 flex items-center justify-center mb-1 md:mb-2">
                <span className={`font-bold gradient-text ${stat.number === "∞" ? "text-4xl md:text-6xl lg:text-7xl leading-none mt-3" : "text-2xl md:text-4xl lg:text-5xl"}`}>{stat.number}</span>
              </div>
              <div className="text-xs md:text-base text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

// Services Section
function ServicesSection() {
  const services = [
    {
      icon: Globe,
      title: "Website Design",
      description: "Fully custom-designed websites tailored to your brand identity and business goals.",
      features: ["Responsive Design", "Creative Layout", "Custom Features"],
    },
    {
      icon: Server,
      title: "Hosting",
      description: "Fast, reliable hosting that keeps your website online and loading quickly around the clock.",
      features: ["Fast Loading", "SSL", "Domain"],
    },
    {
      icon: Zap,
      title: "Maintenance",
      description: "Keep your website secure, updated, and performing at its best 24/7.",
      features: ["Security Updates", "Revisions", "Backups"],
    },
  ];

  const [serviceAnimKeys, setServiceAnimKeys] = useState<Record<string, number>>({});
  useEffect(() => {
    const handler = (e: Event) => {
      const svc = (e as CustomEvent).detail as string;
      setServiceAnimKeys(prev => ({ ...prev, [svc]: (prev[svc] || 0) + 1 }));
    };
    window.addEventListener("highlightService", handler);
    return () => window.removeEventListener("highlightService", handler);
  }, []);

  return (
    <>
      <style>{`@keyframes servicePop{0%{transform:scale(1);box-shadow:none}5%{transform:scale(1.1);box-shadow:0 0 0 4px rgba(249,115,22,0.75),0 24px 64px rgba(249,115,22,0.2)}13%{transform:scale(0.96);box-shadow:0 0 0 2px rgba(249,115,22,0.45)}22%{transform:scale(1.06);box-shadow:0 0 0 2px rgba(249,115,22,0.25)}31%{transform:scale(1);box-shadow:none}100%{transform:scale(1)}} .service-pop{animation:servicePop 15s ease-out forwards}`}</style>
      <section className="py-20 relative">
      <div id="services" className="max-w-[96rem] mx-auto px-6" style={{ scrollMarginTop: "88px" }}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Services</Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Everything You Need to
            <br />
            <span className="gradient-text">Succeed Online</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            From discovery to deployment and beyond, we provide comprehensive sites for businesses of all types and sizes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={`${service.title}-${serviceAnimKeys[service.title] || 0}`}
              className={`p-8 bg-card/50 border-border/50 hover-lift card-shine group cursor-pointer ${serviceAnimKeys[service.title] ? "service-pop" : ""}`}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <service.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-6">{service.description}</p>
              <div className="flex flex-wrap gap-2">
                {service.features.map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}

// Process Section
function ProcessSection() {
  const [stepAnimKeys, setStepAnimKeys] = useState<Record<string, number>>({});

  useEffect(() => {
    const handler = (e: Event) => {
      const title = (e as CustomEvent).detail as string;
      setStepAnimKeys(prev => ({ ...prev, [title]: Date.now() }));
    };
    window.addEventListener("highlightProcess", handler);
    return () => window.removeEventListener("highlightProcess", handler);
  }, []);

  const steps = [
    {
      number: "01",
      title: "Discovery",
      description: "Either through inbound or outbound discovery, we receive your contact form submission.",
    },
    {
      number: "02",
      title: "Design",
      description: "Our designers draft beautiful sites that align with your brand and user experience goals.",
    },
    {
      number: "03",
      title: "Development",
      description: "Once you approve your free draft over our meeting, we finish developing your site with care.",
    },
    {
      number: "04",
      title: "Deployment",
      description: "After thorough testing, we connect your domain and deploy your site to the world.",
    },
  ];

  return (
    <section className="py-32 relative">
      <style>{`@keyframes stepPop{0%{transform:scale(1);box-shadow:none}5%{transform:scale(1.06);box-shadow:0 0 0 4px rgba(249,115,22,0.75),0 24px 64px rgba(249,115,22,0.2)}13%{transform:scale(0.97);box-shadow:0 0 0 2px rgba(249,115,22,0.45)}22%{transform:scale(1.03);box-shadow:0 0 0 2px rgba(249,115,22,0.25)}31%{transform:scale(1);box-shadow:none}100%{transform:scale(1)}} .step-pop{border-radius:0.75rem;animation:stepPop 15s ease-out forwards}`}</style>
      <div id="process" className="max-w-7xl mx-auto px-6" style={{ scrollMarginTop: "88px" }}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Process</Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Simple Steps to Your
            <br />
            <span className="gradient-text">Dream Website</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Our proven process ensures a smooth journey from concept to launch.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className={`relative ${stepAnimKeys[step.title] ? "step-pop" : ""}`}>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2" />
              )}
              <div className="text-7xl font-extrabold text-primary/10 mb-4">{step.number}</div>
              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// About Us Section
function AboutUsSection() {
  return (
    <section className="py-20 relative">
      <div id="about" className="max-w-7xl mx-auto px-6" style={{ scrollMarginTop: "88px" }}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">About</Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            You Spoke to
            <br />
            <span className="gradient-text">One of Us</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
          <Card className="p-8 bg-card/50 border-border/50 hover-lift text-center">
            <h3 className="text-2xl font-bold mb-2">Matthew M.</h3>
            <div className="text-primary font-semibold">Co-Founder</div>
          </Card>
          <Card className="p-8 bg-card/50 border-border/50 hover-lift text-center">
            <h3 className="text-2xl font-bold mb-2">Christopher M.</h3>
            <div className="text-primary font-semibold">Co-Founder</div>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="p-8 bg-card/50 border-border/50">
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              Matthew and Christopher became friends in middle school, but later began this project in 2025 as college students to deliver superb websites in an expedited fashion to businesses of all types and sizes. They continue to focus on improving the online presence and customer outreach of their clients through their services.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection({ onOpenPayment }: { onOpenPayment: (plan: "one-time" | "monthly", billing?: "monthly" | "annual") => void }) {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showEquityCmsPopup, setShowEquityCmsPopup] = useState(false);
  const [showUpfrontPopup, setShowUpfrontPopup] = useState(false);
  const [showMonthlyPopup, setShowMonthlyPopup] = useState(false);
  const [showAnnualPopup, setShowAnnualPopup] = useState(false);
  const [showUpfrontBubble, setShowUpfrontBubble] = useState(false);
  const [showMonthlyBubble, setShowMonthlyBubble] = useState(false);
  const [showAnnualBubble, setShowAnnualBubble] = useState(false);
  const [showHybridBubble, setShowHybridBubble] = useState(false);
  const [showHybridPopup, setShowHybridPopup] = useState(false);
  const [showEquityBubble, setShowEquityBubble] = useState(false);
  const [equityVote, setEquityVote] = useState<'up' | 'down' | null>(null);
  const [planAnimKeys, setPlanAnimKeys] = useState<Record<string, number>>({});

  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent).detail as string;
      setPlanAnimKeys(prev => ({ ...prev, [name]: Date.now() }));
    };
    window.addEventListener("highlightPlan", handler);
    return () => window.removeEventListener("highlightPlan", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setShowUpfrontBubble(true); setShowMonthlyBubble(true); setShowHybridBubble(true); setShowAnnualBubble(true); setShowEquityBubble(true); }, 10000);
    return () => clearTimeout(t);
  }, []);


  const plans = [
    {
      name: "Upfront",
      price: "Contact us",
      priceLabel: "for more information",
      description: "",
      features: [
        "Custom Design",
        "Domain",
        "SSL Certificate",
        "Performance Optimization",
        "3 Revisions Total",
        "Temporary Support",
      ],
      popular: false,
    },
    {
      name: "Monthly",
      price: "Contact us",
      priceLabel: "for more information",
      description: "Everything in Upfront, including:",
      features: [
        "Advanced Security",
        "Analytics Reports",
        "Copywriting",
        "Content Strategy",
        "2 Revisions / Month",
        "Continued Support",
      ],
      popular: true,
    },
    {
      name: "Hybrid",
      price: "Contact us",
      priceLabel: "for more information",
      description: "",
      features: [
        "Advanced Security",
        "Analytics Reports",
        "Copywriting",
        "Content Strategy",
        "4 Revisions / Month",
        "Continued Support",
        "__green__10% Off / Month",
      ],
      popular: false,
    },
    {
      name: "Annual",
      price: "Contact us",
      priceLabel: "for more information",
      description: "Everything in Hybrid, including:",
      features: [
        "Redesigns",
        "Unlimited Revisions",
        "VIP, Priority Support",
        "__green__20% Off / Year",
      ],
      popular: false,
    },
    {
      name: "Equity",
      price: "Contact us",
      priceLabel: "for more information",
      description: "",
      features: [],
      popular: false,
      hasTooltip: true,
    },
  ];

  return (
    <>
      <section className="pt-32 pb-32 relative overflow-x-hidden">
      <style>{`@keyframes planPop{0%{transform:scale(1);box-shadow:none}5%{transform:scale(1.05);box-shadow:0 0 0 4px rgba(249,115,22,0.75),0 24px 64px rgba(249,115,22,0.2)}13%{transform:scale(0.98);box-shadow:0 0 0 2px rgba(249,115,22,0.45)}22%{transform:scale(1.02);box-shadow:0 0 0 2px rgba(249,115,22,0.25)}31%{transform:scale(1);box-shadow:none}100%{transform:scale(1)}} .plan-pop{animation:planPop 15s ease-out forwards}`}</style>
      <div id="pricing" className="max-w-[1600px] mx-auto px-4" style={{ scrollMarginTop: "88px" }}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Plans</Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            The Plan That's
            <br />
            <span className="gradient-text">Right for You</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect Plan for your business. All Plans include our quality and satisfaction guaranteed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-6 relative group h-full flex flex-col ${planAnimKeys[plan.name] ? "plan-pop" : ""} ${
                plan.popular
                  ? "bg-primary/5 border-primary/30 animate-attention-bounce"
                  : plan.name === "Annual"
                  ? "bg-green-500/15 border-green-500/50 animate-attention-bounce"
                  : plan.name === "Hybrid"
                  ? "bg-green-500/5 border-green-500/20 animate-attention-bounce"
                  : "bg-card/50 border-border/50"
              } ${(plan.name === "Hybrid" || plan.name === "Annual") ? "hover-lift-green" : "hover-lift"}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Popular
                </Badge>
              )}
              {plan.name === "Hybrid" && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 hover:bg-green-600 text-white border-0 transition-all duration-300" style={{boxShadow: "0 2px 12px rgba(34, 197, 94, 0.5)"}}>
                  Save 10%
                </Badge>
              )}
              {plan.name === "Annual" && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 hover:bg-green-600 text-white border-0 transition-all duration-300 px-3" style={{boxShadow: "0 2px 20px rgba(34, 197, 94, 0.75)"}}>
                  Save 20%
                </Badge>
              )}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                {plan.name === "Hybrid" && (
                  <div className="relative">
                    {showHybridBubble && (
                      <div className="absolute bottom-0 left-full ml-2 z-20 pointer-events-none">
                        <div className="bg-foreground text-background text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium shadow-lg animate-fade-in">
                          Is this Plan for me?
                          <div className="absolute top-1/2 -translate-y-1/2 right-full border-4 border-transparent border-r-foreground" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 text-xs bg-muted rounded-full hover:bg-primary/20 transition-colors"
                      onClick={() => { setShowHybridPopup(true); setShowHybridBubble(false); }}
                    >
                      ?
                    </button>
                  </div>
                )}
                {plan.name === "Upfront" && (
                  <div className="relative">
                    {showUpfrontBubble && (
                      <div className="absolute bottom-0 left-full ml-2 z-20 pointer-events-none">
                        <div className="bg-foreground text-background text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium shadow-lg animate-fade-in">
                          Is this Plan for me?
                          <div className="absolute top-1/2 -translate-y-1/2 right-full border-4 border-transparent border-r-foreground" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 text-xs bg-muted rounded-full hover:bg-primary/20 transition-colors"
                      onClick={() => { setShowUpfrontPopup(true); setShowUpfrontBubble(false); }}
                    >
                      ?
                    </button>
                  </div>
                )}
                {plan.name === "Monthly" && (
                  <div className="relative">
                    {showMonthlyBubble && (
                      <div className="absolute bottom-0 left-full ml-2 z-20 pointer-events-none">
                        <div className="bg-foreground text-background text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium shadow-lg animate-fade-in">
                          Is this Plan for me?
                          <div className="absolute top-1/2 -translate-y-1/2 right-full border-4 border-transparent border-r-foreground" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 text-xs bg-muted rounded-full hover:bg-primary/20 transition-colors"
                      onClick={() => { setShowMonthlyPopup(true); setShowMonthlyBubble(false); }}
                    >
                      ?
                    </button>
                  </div>
                )}
                {plan.name === "Annual" && (
                  <div className="relative">
                    {showAnnualBubble && (
                      <div className="absolute bottom-0 left-full ml-2 z-20 pointer-events-none">
                        <div className="bg-foreground text-background text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium shadow-lg animate-fade-in">
                          Is this Plan for me?
                          <div className="absolute top-1/2 -translate-y-1/2 right-full border-4 border-transparent border-r-foreground" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 text-xs bg-muted rounded-full hover:bg-primary/20 transition-colors"
                      onClick={() => { setShowAnnualPopup(true); setShowAnnualBubble(false); }}
                    >
                      ?
                    </button>
                  </div>
                )}
                {plan.name === "Equity" && (
                  <div className="relative">
                    {showEquityBubble && (
                      <div className="absolute bottom-0 left-full ml-2 z-20 pointer-events-none">
                        <div className="bg-foreground text-background text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium shadow-lg animate-fade-in">
                          Is this Plan for me?
                          <div className="absolute top-1/2 -translate-y-1/2 right-full border-4 border-transparent border-r-foreground" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 text-xs bg-muted rounded-full hover:bg-primary/20 transition-colors"
                      onClick={() => { setShowEquityCmsPopup(true); setShowEquityBubble(false); }}
                    >
                      ?
                    </button>
                  </div>
                )}
              </div>
              {plan.description && (
                <p className="mb-4 font-medium text-muted-foreground">
                  {(plan.name === "Monthly" || plan.name === "Hybrid" || plan.name === "Annual")
                    ? <span>{plan.description}<span title="Conditions may apply." className="text-red-500 font-bold text-sm cursor-help ml-0.5 align-middle">*</span></span>
                    : plan.description}
                </p>
              )}
              <Separator className="mb-6" />
              {plan.features.length > 0 ? (
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature: string) => (
                    feature.startsWith("__green__") ? (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 ${(plan.name === "Hybrid" || plan.name === "Annual") ? "text-green-500" : "text-primary"}`} />
                        <span className="text-green-500">{feature.replace("__green__", "")}</span>
                      </div>
                    ) : feature.startsWith("__sub__") ? (
                      <div key={feature} className="flex items-center gap-3 pl-6">
                        <Check className={`w-4 h-4 flex-shrink-0 ${(plan.name === "Hybrid" || plan.name === "Annual") ? "text-green-500" : "text-primary"}`} />
                        <span className="text-sm">{feature.replace("__sub__", "")}</span>
                      </div>
                    ) : feature === "Domain" ? (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 ${(plan.name === "Hybrid" || plan.name === "Annual") ? "text-green-500" : "text-primary"}`} />
                        <span>Domain<span title="Conditions may apply." className="text-red-500 font-bold text-sm cursor-help ml-0.5 align-middle">*</span></span>
                      </div>
                    ) : (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 ${(plan.name === "Hybrid" || plan.name === "Annual") ? "text-green-500" : "text-primary"}`} />
                        <span>{feature}</span>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="flex-1 mb-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 flex flex-col items-center justify-center text-center">
                  <Zap className="w-7 h-7 text-primary mx-auto mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-foreground mb-1">Something special is brewing</p>
                  <p className="text-xs text-muted-foreground">Exciting amenities are on the way — stay tuned.</p>
                </div>
              )}
              <Button
                className={`w-full mt-auto ${
                  plan.popular
                    ? "bg-primary hover:bg-primary/90"
                    : plan.name === "Equity"
                    ? "bg-secondary text-muted-foreground hover:bg-secondary hover:text-muted-foreground cursor-pointer"
                    : (plan.name === "Hybrid" || plan.name === "Annual")
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-primary hover:bg-primary/90"
                } transition-all duration-300`}
                style={(plan.name === "Hybrid" || plan.name === "Annual") ? {boxShadow: "0 4px 20px rgba(34, 197, 94, 0.4)"} : undefined}
                onClick={() => {
                  if (plan.name === "Upfront") {
                    onOpenPayment("one-time");
                  } else if (plan.name === "Monthly") {
                    onOpenPayment("monthly", "monthly");
                  } else if (plan.name === "Hybrid") {
                    onOpenPayment("hybrid" as "monthly", "monthly");
                  } else if (plan.name === "Annual") {
                    onOpenPayment("monthly", "annual");
                  } else if (plan.name === "Equity") {
                    setShowComingSoon(true);
                  }
                }}
              >
                Buy Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          ))}
        </div>


        {showComingSoon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowComingSoon(false)}
            />
            <div className="relative bg-card border border-border rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-slideIn">
              <button
                type="button"
                onClick={() => setShowComingSoon(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-6">
                  The Equity Plan is currently in development. We're working hard to bring you an exciting new way to partner with us!
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  <button type="button" onClick={() => { setShowComingSoon(false); setTimeout(() => setShowEquityCmsPopup(true), 150); }} className="text-orange-500 font-medium underline">Want to know how this Plan works?</button>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  In the meantime, check out our available Plans.
                </p>
                <Button
                  onClick={() => setShowComingSoon(false)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Got It
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Comparison Table — inline between pricing cards and contact form */}
      <div id="comparison" className="max-w-[96rem] mx-auto px-6 mt-16">
        <div className="bg-card/50 border border-border/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-5">Plan Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 font-semibold text-foreground w-1/5">Amenities</th>
                  <th className="text-center py-2 px-4 font-semibold text-foreground">Upfront</th>
                  <th className="text-center py-2 px-4 font-semibold text-foreground">Monthly</th>
                  <th className="text-center py-2 px-4 font-semibold text-foreground">Hybrid</th>
                  <th className="text-center py-2 px-4 font-semibold text-foreground">Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {([
                  { perk: "Custom Design", up: true, mo: true, hy: true, an: true },
                  { perk: "Domain", up: true, mo: true, hy: true, an: true },
                  { perk: "SSL Certificate", up: true, mo: true, hy: true, an: true },
                  { perk: "Performance", up: true, mo: true, hy: true, an: true },
                  { perk: "Security", up: true, mo: true, hy: true, an: true },
                  { perk: "Revisions", up: "3", mo: "2/month", hy: "4/month", an: "∞" },
                  { perk: "Support", up: "6 Months", mo: "∞", hy: "∞", an: "∞⚡" },
                  { perk: "Analytics", up: false, mo: true, hy: true, an: true },
                  { perk: "Copywriting", up: false, mo: true, hy: true, an: true },
                  { perk: "Content Strategy", up: false, mo: true, hy: true, an: true },
                  { perk: "Monthly Discount", up: false, mo: false, hy: "10%", an: "20%" },
                  { perk: "Redesigns", up: false, mo: false, hy: false, an: true },
                ] as { perk: string; up: boolean | string; mo: boolean | string; hy: boolean | string; an: boolean | string }[]).map(({ perk, up, mo, hy, an }) => {
                  const cell = (v: boolean | string) => typeof v === "string"
                    ? <span className={`text-xs font-semibold ${typeof v === "string" && v.endsWith("%") ? "text-green-500" : "text-foreground"}`}>{v}</span>
                    : v ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : null;
                  return (
                    <tr key={perk} className="transition-colors hover:bg-muted/20">
                      <td className={`py-3 pr-4 ${perk === "Monthly Discount" ? "text-green-500" : "text-muted-foreground"}`}>{perk}{(perk === "Domain" || perk === "Revisions") && <span className="text-red-500 font-bold text-xs cursor-help ml-0.5 align-middle" title="Conditions may apply.">*</span>}</td>
                      <td className="text-center py-3 px-4">{cell(up)}</td>
                      <td className="text-center py-3 px-4">{cell(mo)}</td>
                      <td className="text-center py-3 px-4">{cell(hy)}</td>
                      <td className="text-center py-3 px-4">{cell(an)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Equity/CMS popup — rendered at section level to avoid scroll glitch */}

      {/* Upfront Plan Popup */}
      {showUpfrontPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUpfrontPopup(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Is the Upfront Plan for me?</h3>
              <button type="button" onClick={() => setShowUpfrontPopup(false)} className="text-muted-foreground hover:text-foreground transition-colors ml-3 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>The <span className="font-semibold text-foreground">Upfront Plan</span> is a one-time fee — <strong className="text-foreground">no</strong> subscription, <strong className="text-foreground">no</strong> recurring charges. It’s best suited for:</p>
              <ul className="space-y-1.5 list-none">
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>First-time site owners looking for a quick, <strong className="text-foreground">simple</strong> site with minimal changes</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Those interested in <button type="button" onClick={() => { setShowUpfrontPopup(false); window.dispatchEvent(new CustomEvent('openFaqAt', { detail: 1 })); }} className="text-orange-500 hover:underline font-medium">temporary support</button> and <strong className="text-foreground">short-term</strong> benefits</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Businesses that aim to <strong className="text-foreground">limit</strong> recurring costs</span></li>
              </ul>
            </div>
            <button type="button" onClick={() => setShowUpfrontPopup(false)} className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Got It</button>
          </div>
        </div>
      )}

      {/* Monthly Plan Popup */}
      {showMonthlyPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMonthlyPopup(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Is the Monthly Plan for me?</h3>
              <button type="button" onClick={() => setShowMonthlyPopup(false)} className="text-muted-foreground hover:text-foreground transition-colors ml-3 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>The <span className="font-semibold text-foreground">Monthly Plan</span> is a recurring monthly subscription — It’s ideal for:</p>
              <ul className="space-y-1.5 list-none">
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Growing businesses that want <strong className="text-foreground">continued</strong> support and ongoing updates</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span><strong className="text-foreground">Moderately</strong> involved sites that benefit from regular revisions (2/month)</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>People who prefer to spread their costs <strong className="text-foreground">over time</strong> rather than submitting an upfront sum</span></li>
              </ul>
            </div>
            <button type="button" onClick={() => setShowMonthlyPopup(false)} className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Got It</button>
          </div>
        </div>
      )}

      {/* Hybrid Plan Popup */}
      {showHybridPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHybridPopup(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Is the Hybrid Plan for me?</h3>
              <button type="button" onClick={() => setShowHybridPopup(false)} className="text-muted-foreground hover:text-foreground transition-colors ml-3 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>The <span className="font-semibold text-foreground">Hybrid Plan</span> is a combination of the Upfront and Monthly Plans. It's perfect for:</p>
              <ul className="space-y-1.5 list-none">
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Businesses that would like to pay an upfront fee for <span className="text-green-500 font-semibold">10% off</span> each month</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Individuals who could use 2 <strong className="text-foreground">extra</strong> monthly revisions</span></li>
              </ul>
            </div>
            <button type="button" onClick={() => setShowHybridPopup(false)} className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Got It</button>
          </div>
        </div>
      )}

      {/* Annual Plan Popup */}
      {showAnnualPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAnnualPopup(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Is the Annual Plan for me?</h3>
              <button type="button" onClick={() => setShowAnnualPopup(false)} className="text-muted-foreground hover:text-foreground transition-colors ml-3 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>The <span className="font-semibold text-foreground">Annual Plan</span> is a recurring yearly subscription — It’s beneficial for:</p>
              <ul className="space-y-1.5 list-none">
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Established businesses looking to <strong className="text-foreground">commit</strong> for the year</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span><strong className="text-foreground">Complex</strong> sites with <strong className="text-foreground">premium</strong> amenities, including unlimited revisions and priority support</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Business owners interested in <strong className="text-foreground">long-term</strong> growth and <span className="text-green-500 font-semibold">20% off</span> (approx. 2.4 months free)</span></li>
              </ul>
            </div>
            <button type="button" onClick={() => setShowAnnualPopup(false)} className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Got It</button>
          </div>
        </div>
      )}

      {showEquityCmsPopup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowEquityCmsPopup(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Is the Equity Plan for me?</h3>
              <button type="button" onClick={() => setShowEquityCmsPopup(false)} className="text-muted-foreground hover:text-foreground transition-colors ml-3 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed mb-4">
              <p>The <span className="font-semibold text-foreground">Equity Plan</span> is a revenue-percentage agreement — It's appropriate for:</p>
              <ul className="space-y-1.5 list-none">
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Startups and small businesses looking to <strong className="text-foreground">minimize</strong> upfront and/or recurring costs</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Extremely <strong className="text-foreground">advanced</strong> sites with highly intricate back-end systems</span></li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">·</span><span>Businesses interested in a <strong className="text-foreground">lifetime</strong> agreement with GimmeASite</span></li>
              </ul>
              <div className="pt-3 border-t border-border/40">
                <p className="font-semibold text-foreground text-xs mb-2">Do you like this Plan?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const next = equityVote === 'up' ? null : 'up';
                      setEquityVote(next);
                      if (next) {
                        try { await getSupabase().from("equity_votes").insert({ vote: next }); } catch { /* non-critical */ }
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${equityVote === 'up' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-border/50 text-muted-foreground hover:border-green-500/50 hover:text-green-500'}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = equityVote === 'down' ? null : 'down';
                      setEquityVote(next);
                      if (next) {
                        try { await getSupabase().from("equity_votes").insert({ vote: next }); } catch { /* non-critical */ }
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${equityVote === 'down' ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-border/50 text-muted-foreground hover:border-red-500/50 hover:text-red-500'}`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEquityCmsPopup(false)}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </section>
    </>
  );
}

function ErrorWithEmail({ msg }: { msg: string }) {
  const email = "hello@gimmeasite.com";
  const parts = msg.split(email);
  if (parts.length === 1) return <>{msg}</>;
  return <>{parts[0]}<a href={`mailto:${email}`} className="font-bold underline underline-offset-2">{email}</a>{parts[1]}</>;
}

// Contact Section
function ContactSection({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    domain: "",
    paymentPlan: "",
    message: "",
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    googleBusiness: "",
  });
  const [formStep, setFormStep] = useState(1);
  const [step2Data, setStep2Data] = useState({
    homePurpose: "", homeValueProp: "", homeAction: "", homeDetails: "",
    aboutBusiness: "", aboutUnique: "", aboutFeel: "", aboutDetails: "",
    servicesInfo: "", servicesBenefits: "", servicesOffers: "", servicesDetails: "",
    contactMethods: "", contactHours: "", contactCTA: "", contactDetails: "",
    additionalPages: [] as string[],
    additionalPagesDetails: "",
  });
  const [showAdditionalPagesHelp, setShowAdditionalPagesHelp] = useState(false);
  const [showAttachmentsHelp, setShowAttachmentsHelp] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showWhyPopup, setShowWhyPopup] = useState<"company" | "social" | "phone" | "plan" | "domain" | "google" | "ownsDomain" | null>(null);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showSubmitToast, setShowSubmitToast] = useState(false);
  const [validatingSocial, setValidatingSocial] = useState<Record<string, boolean>>({});
  const [socialValidated, setSocialValidated] = useState<Record<string, boolean>>({});
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainAvailability, setDomainAvailability] = useState<"available" | "unavailable" | null>(null);
  const [ownsDomain, setOwnsDomain] = useState(false);
  const [existingDomain, setExistingDomain] = useState("");

  // Hide toast after 5 seconds
  useEffect(() => {
    if (showSubmitToast) {
      const timer = setTimeout(() => {
        setShowSubmitToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSubmitToast]);

  // Reset form to empty state after 5 seconds of success
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  // Leave-site prompt when any field has data
  useEffect(() => {
    const hasData = Object.values(formData).some(v => typeof v === "string" && v.trim()) || ownsDomain || existingDomain.trim();
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    if (hasData) { window.addEventListener("beforeunload", handler); return () => window.removeEventListener("beforeunload", handler); }
  }, [formData, ownsDomain, existingDomain]);

  // Domain validation regex
  const validateDomainFormat = (domain: string): boolean => {
    if (!domain.trim()) return true; // Empty is handled by required validation
    // Domain pattern: alphanumeric, hyphens, with a valid TLD
    const domainPattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;
    return domainPattern.test(domain);
  };

  // Check domain availability — checks both A and NS records so registered-but-unhosted domains show as taken
  const checkDomainAvailability = async (domain: string) => {
    if (!domain.trim() || !validateDomainFormat(domain)) {
      setDomainAvailability(null);
      return;
    }

    setCheckingDomain(true);
    setDomainAvailability(null);

    try {
      const [aRes, nsRes] = await Promise.all([
        fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`),
        fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`),
      ]);

      if (aRes.ok && nsRes.ok) {
        const [aData, nsData] = await Promise.all([aRes.json(), nsRes.json()]);
        const hasA = aData.Answer && aData.Answer.length > 0;
        const hasNS = nsData.Answer && nsData.Answer.length > 0;
        if (hasA || hasNS) {
          setDomainAvailability("unavailable");
        } else if (aData.Status === 3 && nsData.Status === 3) {
          setDomainAvailability("available");
        } else {
          setDomainAvailability("available");
        }
      } else {
        setDomainAvailability(null);
      }
    } catch (error) {
      console.error("Domain check error:", error);
      setDomainAvailability(null);
    } finally {
      setCheckingDomain(false);
    }
  };

  // Detect common email domain typos
  const getSuspiciousEmailDomainError = (email: string): string | null => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return null;
    const typos: Record<string, string> = {
      "gmail.co": "gmail.com", "gmial.com": "gmail.com", "gmai.com": "gmail.com",
      "gamil.com": "gmail.com", "gmail.con": "gmail.com", "gnail.com": "gmail.com",
      "hotmail.co": "hotmail.com", "hotmial.com": "hotmail.com", "hotamil.com": "hotmail.com",
      "hotmal.com": "hotmail.com", "hotmaill.com": "hotmail.com",
      "yahoo.co": "yahoo.com", "yahooo.com": "yahoo.com", "yaho.com": "yahoo.com",
      "outlok.com": "outlook.com", "outloook.com": "outlook.com", "outloo.com": "outlook.com",
      "icloud.co": "icloud.com", "aol.co": "aol.com", "protonmail.co": "protonmail.com",
      "googlemail.co": "googlemail.com",
    };
    if (typos[domain]) {
      const local = email.split("@")[0];
      return `Did you mean ${local}@${typos[domain]}?`;
    }
    return null;
  };

  // Social media URL validation
  const validateSocialMediaUrl = async (platform: string, username: string): Promise<boolean> => {
    if (!username.trim()) return true; // Empty is valid (optional field)

    const urls: Record<string, string> = {
      instagram: `https://instagram.com/${username}`,
      facebook: `https://facebook.com/${username}`,
      twitter: `https://x.com/${username}`,
      youtube: `https://youtube.com/${username}`,
      tiktok: `https://tiktok.com/@${username}`,
      linkedin: `https://linkedin.com/company/${username}`,
    };

    // For Google Business, only accept https://share.google/ links
    if (platform === 'googleBusiness') {
      return /^https:\/\/share\.google\//i.test(username.trim());
    }

    // Basic username format validation
    if (platform === 'instagram' || platform === 'twitter' || platform === 'tiktok') {
      // Instagram, Twitter, TikTok usernames: alphanumeric, underscores, periods (no special chars at start/end)
      const usernamePattern = /^[a-zA-Z0-9][\w.]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
      if (!usernamePattern.test(username) && username.length > 1) {
        return false;
      }
    }

    return true;
  };

  const handleSocialBlur = async (platform: string, value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, [platform]: "" }));
      setSocialValidated(prev => ({ ...prev, [platform]: false }));
      return;
    }

    const atPlatforms = ["instagram", "twitter", "tiktok", "linkedin", "facebook"];
    if (atPlatforms.includes(platform) && value.startsWith("@")) {
      setErrors(prev => ({ ...prev, [platform]: "Please remove the @ symbol — just enter your username." }));
      setSocialValidated(prev => ({ ...prev, [platform]: false }));
      return;
    }

    setValidatingSocial(prev => ({ ...prev, [platform]: true }));

    const isValid = await validateSocialMediaUrl(platform, value);

    setValidatingSocial(prev => ({ ...prev, [platform]: false }));

    if (!isValid) {
      if (platform === 'googleBusiness') {
        setErrors(prev => ({ ...prev, [platform]: "Please enter a valid Google Business share link starting with https://share.google/" }));
      } else {
        setErrors(prev => ({ ...prev, [platform]: "This username format appears to be invalid" }));
      }
      setSocialValidated(prev => ({ ...prev, [platform]: false }));
    } else {
      setErrors(prev => ({ ...prev, [platform]: "" }));
      setSocialValidated(prev => ({ ...prev, [platform]: true }));
    }
  };

  const handleDomainSearch = async () => {
    const value = formData.domain;

    if (!value.trim()) {
      setErrors(prev => ({ ...prev, domain: "Domain is required", domainSearch: "" }));
      setDomainAvailability(null);
      return;
    }

    if (!validateDomainFormat(value)) {
      setErrors(prev => ({ ...prev, domain: "Please enter a valid domain (e.g., example.com)", domainSearch: "" }));
      setDomainAvailability(null);
      return;
    }

    // Special check for gimmeasite.com
    if (value.toLowerCase() === "gimmeasite.com") {
      setErrors(prev => ({ ...prev, domain: "Hey, that's us! Nice try lol. Please try a different one.", domainSearch: "" }));
      setDomainAvailability("unavailable");
      return;
    }

    setErrors(prev => ({ ...prev, domain: "", domainSearch: "" }));
    await checkDomainAvailability(value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name.trim())) {
      newErrors.name = "Name can only contain letters, spaces, hyphens, and apostrophes";
    } else if (formData.name.trim().split(/\s+/).filter(Boolean).length < 2) {
      newErrors.name = "Please enter your first and last name";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    } else {
      const domainHint = getSuspiciousEmailDomainError(formData.email);
      if (domainHint) newErrors.email = domainHint;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phone = formData.phone.trim();
      const validChars = /^[\d\s\-\+\(\.\)]+$/;
      if (!validChars.test(phone)) {
        newErrors.phone = "Phone number can only contain digits, spaces, +, -, (, ), and .";
      } else {
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length < 7) {
          newErrors.phone = "Phone number must have at least 7 digits";
        } else if (digitsOnly.length > 15) {
          newErrors.phone = "Phone number must have no more than 15 digits";
        }
      }
    }

    // Domain validation
    if (!ownsDomain && !formData.domain.trim()) {
      newErrors.domain = "Domain is required";
    } else if (formData.domain.trim() && !validateDomainFormat(formData.domain)) {
      newErrors.domain = "Please enter a valid domain (e.g., example.com)";
    } else if (formData.domain.toLowerCase() === "gimmeasite.com") {
      newErrors.domain = "Hey, that's us! Nice try lol. Please try a different one.";
    } else if (!ownsDomain && formData.domain.trim() && domainAvailability === null) {
      newErrors.domainSearch = "Please search for domain availability before submitting";
    } else if (!ownsDomain && domainAvailability === "unavailable") {
      newErrors.domain = "This domain is already taken. Please choose a different one.";
    } else if (!ownsDomain) {
      const submittedDomains: string[] = JSON.parse(localStorage.getItem('gs_submitted_domains') || '[]');
      const domainKey = formData.domain.toLowerCase().trim().replace(/^www\./, '');
      if (domainKey && submittedDomains.includes(domainKey)) {
        newErrors.domain = "A request for this domain has already been submitted. Please contact us at hello@gimmeasite.com if you have any questions.";
      }
    }
    if (ownsDomain && !existingDomain.trim()) {
      newErrors.existingDomain = "Please enter your existing domain";
    } else if (ownsDomain && existingDomain.trim()) {
      const submittedDomains: string[] = JSON.parse(localStorage.getItem('gs_submitted_domains') || '[]');
      const domainKey = existingDomain.toLowerCase().trim().replace(/^www\./, '');
      if (domainKey && submittedDomains.includes(domainKey)) {
        newErrors.existingDomain = "A request for this domain has already been submitted. Please contact us at hello@gimmeasite.com if you have questions.";
      }
    }

    if (!formData.paymentPlan) {
      newErrors.paymentPlan = "Payment plan is required";
    }
    const isUpfrontPlan = !formData.paymentPlan || formData.paymentPlan === "Upfront";
    if (isUpfrontPlan && !formData.message.trim()) {
      newErrors.message = "Project description is required";
    }

    // Social media validation (only if not empty)
    const socialPlatforms = [
      "instagram",
      "facebook",
      "twitter",
      "youtube",
      "tiktok",
      "linkedin",
      "googleBusiness",
    ] as const;
    for (const platform of socialPlatforms) {
      if (formData[platform as keyof typeof formData] && errors[platform]) {
        newErrors[platform] = errors[platform];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isMultiStepPlan = ["Monthly", "Hybrid", "Annual"].includes(formData.paymentPlan);

  const validateStep2 = () => {
    const required = [
      "homeValueProp", "homeAction",
      "aboutBusiness", "aboutUnique",
      "servicesInfo", "servicesOffers",
      "contactMethods", "contactHours",
    ] as const;
    return required.every(k => step2Data[k].trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMultiStepPlan && formStep === 1) {
      if (!validateForm()) return;
      setFormStep(2);
      setTimeout(() => scrollToSection("contact"), 50);
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (isMultiStepPlan && !validateStep2()) {
      setErrors(prev => ({ ...prev, submit: "Please fill out all required fields." }));
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload any attachments to Supabase storage first, collect public URLs
      let attachmentUrls: string[] = [];
      if (attachedFiles.length > 0) {
        const uploadFd = new FormData();
        attachedFiles.forEach(file => uploadFd.append("file", file));
        try {
          const uploadRes = await fetch("/api/contact-attachments", { method: "POST", body: uploadFd });
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            attachmentUrls = uploadJson.urls ?? [];
          }
        } catch { /* attachments optional – proceed without */ }
      }

      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || null,
        payment_plan: formData.paymentPlan,
        owns_domain: ownsDomain,
        desired_domain: ownsDomain ? null : (formData.domain || null),
        existing_domain: ownsDomain ? (existingDomain || null) : null,
        message: isMultiStepPlan ? null : (formData.message || null),
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        twitter: formData.twitter || null,
        youtube: formData.youtube || null,
        tiktok: formData.tiktok || null,
        linkedin: formData.linkedin || null,
        google_business: formData.googleBusiness || null,
        attachments: attachmentUrls.length > 0
          ? attachmentUrls.map(url => ({ url }))
          : null,
      };
      if (isMultiStepPlan) {
        payload.home_value_prop = step2Data.homeValueProp || null;
        payload.home_action = step2Data.homeAction || null;
        payload.about_story = step2Data.aboutBusiness || null;
        payload.about_differentiator = step2Data.aboutUnique || null;
        payload.services_products = step2Data.servicesInfo || null;
        payload.special_offers = step2Data.servicesOffers || null;
        payload.contact_methods = step2Data.contactMethods || null;
        payload.business_hours = step2Data.contactHours || null;
        payload.additional_pages = step2Data.additionalPages.length > 0
          ? step2Data.additionalPages
          : null;
        payload.additional_details = step2Data.additionalPagesDetails || null;
      }

      const { error: insertError } = await getSupabase()
        .from("contact_submissions")
        .insert(payload);

      if (!insertError) {
        setSubmitSuccess(true);
        setShowSubmitToast(true);
        onSuccess?.();
        const domainKey = (ownsDomain ? existingDomain : formData.domain).toLowerCase().trim().replace(/^www\./, '');
        if (domainKey) {
          const submittedDomains: string[] = JSON.parse(localStorage.getItem('gs_submitted_domains') || '[]');
          if (!submittedDomains.includes(domainKey)) {
            submittedDomains.push(domainKey);
            localStorage.setItem('gs_submitted_domains', JSON.stringify(submittedDomains));
          }
        }
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          domain: "",
          paymentPlan: "",
          message: "",
          instagram: "",
          facebook: "",
          twitter: "",
          youtube: "",
          tiktok: "",
          linkedin: "",
          googleBusiness: "",
        });
        setDomainAvailability(null);
        setOwnsDomain(false);
        setExistingDomain("");
        setSocialValidated({});
        setErrors({});
        setAttachedFiles([]);
        setFileErrors([]);
        setFormStep(1);
        setStep2Data({
          homePurpose: "", homeValueProp: "", homeAction: "", homeDetails: "",
          aboutBusiness: "", aboutUnique: "", aboutFeel: "", aboutDetails: "",
          servicesInfo: "", servicesBenefits: "", servicesOffers: "", servicesDetails: "",
          contactMethods: "", contactHours: "", contactCTA: "", contactDetails: "",
          additionalPages: [], additionalPagesDetails: "",
        });
      } else {
        console.error("Supabase insert error:", insertError);
        setErrors(prev => ({ ...prev, submit: "Something went wrong. Please try again or email us at hello@gimmeasite.com." }));
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors(prev => ({ ...prev, submit: "Unable to send your message. Please email us directly at hello@gimmeasite.com." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id } = e.target;
    let value = e.target.value;
    // Strip pasted domain prefixes for all social media username fields
    if (id === "facebook") {
      value = value.replace(/^(?:https?:\/\/)?(?:www\.)?facebook\.com\//i, "");
    } else if (id === "instagram") {
      value = value.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
    } else if (id === "twitter") {
      value = value.replace(/^https?:\/\/(www\.)?(?:twitter|x)\.com\//i, "");
    } else if (id === "youtube") {
      value = value.replace(/^https?:\/\/(www\.)?youtube\.com\/(?:@|c\/|user\/|channel\/)?/i, "");
    } else if (id === "tiktok") {
      value = value.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "");
    } else if (id === "linkedin") {
      value = value.replace(/^https?:\/\/(www\.)?linkedin\.com\/(?:company|in)\//i, "");
    }
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }
    if (id === "domain") {
      setDomainAvailability(null);
    }
  };

  const handlePlanSelect = (plan: string) => {
    setFormData(prev => ({ ...prev, paymentPlan: plan }));
    setShowPlanDropdown(false);
    if (errors.paymentPlan) {
      setErrors(prev => ({ ...prev, paymentPlan: "" }));
    }
  };

  const clearPlanSelection = () => {
    setFormData(prev => ({ ...prev, paymentPlan: "" }));
    setShowPlanDropdown(false);
  };

  return (
    <section className="py-32 relative">
      {/* Toast Notification */}
      {showSubmitToast && (
        <div className="fixed top-24 right-4 z-50 animate-slideIn">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Message Sent!</p>
              <p className="text-sm text-white/90">We'll get back to you within 24 hours.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmitToast(false)}
              className="ml-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div id="contact" className="max-w-7xl mx-auto px-6" style={{ scrollMarginTop: "88px" }}>
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <Badge variant="secondary" className="mb-4">Contact</Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Ready to Start
              <br />
              <span className="gradient-text">Your</span> <span className="gradient-text">Project?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Drop us a message and we'll get back to you within 24 business hours.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <a href="mailto:hello@gimmeasite.com" className="font-semibold text-primary underline hover:opacity-80 transition-opacity">hello@gimmeasite.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Hours (EST)</div>
                  <div className="space-y-0.5 text-sm">
                    {[
                      { day: "Sun", hours: "9AM-5PM" },
                      { day: "Mon", hours: "9AM-5PM" },
                      { day: "Tue", hours: "9AM-5PM" },
                      { day: "Wed", hours: "9AM-5PM" },
                      { day: "Thu", hours: "9AM-5PM" },
                      { day: "Fri", hours: "9AM-5PM" },
                      { day: "Sat", hours: "9AM-5PM" },
                    ].map(({ day, hours }) => (
                      <div key={day} className="flex gap-3">
                        <span className="font-bold text-white w-8">{day}</span>
                        {hours === "Closed"
                          ? <span className="text-muted-foreground italic">{hours}</span>
                          : <span className="text-white">{hours}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-8 bg-card/50 border-border/50">
            {submitSuccess ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
              </div>
            ) : (<>
              <form onSubmit={handleSubmit} className="space-y-6" style={{ display: formStep === 1 ? undefined : "none" }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Full Name <span className="text-red-500 cursor-help" title="Required field">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="First Last"
                      className={`bg-background ${errors.name ? "border-red-500" : ""}`}
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email <span className="text-red-500 cursor-help" title="Required field">*</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className={`bg-background ${errors.email ? "border-red-500" : ""}`}
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <label htmlFor="phone" className="text-sm font-medium">Phone Number <span className="text-red-500 cursor-help" title="Required field">*</span></label>
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={(e) => { e.preventDefault(); setShowWhyPopup("phone"); }}
                      >?</button>
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className={`bg-background ${errors.phone ? "border-red-500" : ""}`}
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <label htmlFor="company" className="text-sm font-medium">Company</label>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Recommended</span>
                      <button
                        type="button"
                        onClick={() => setShowWhyPopup("company")}
                        className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                        aria-label="Why is this recommended?"
                      >?</button>
                    </div>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Example, Inc."
                      className="bg-background"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="ownsDomain"
                    checked={ownsDomain}
                    onChange={(e) => {
                      setOwnsDomain(e.target.checked);
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, domain: "" }));
                        setDomainAvailability(null);
                      } else {
                        setExistingDomain("");
                      }
                      setErrors(prev => ({ ...prev, domain: "", domainSearch: "", existingDomain: "" }));
                    }}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    Do you own your domain already?
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWhyPopup("ownsDomain"); }}
                    >?</button>
                  </span>
                </label>

                {ownsDomain && (
                  <div>
                    <label htmlFor="existingDomain" className="text-sm font-medium block mb-2">
                      What is your domain? <span className="text-red-500 cursor-help" title="Required field">*</span>
                    </label>
                    <Input
                      id="existingDomain"
                      type="text"
                      placeholder="example.com"
                      className={`bg-background ${errors.existingDomain ? "border-red-500" : ""}`}
                      value={existingDomain}
                      onChange={(e) => {
                        setExistingDomain(e.target.value);
                        setErrors(prev => ({ ...prev, existingDomain: "" }));
                      }}
                    />
                    {errors.existingDomain && (
                      <p className="text-red-500 text-xs mt-1">{errors.existingDomain}</p>
                    )}
                  </div>
                )}

                {/* Domain Field */}
                {!ownsDomain && <div className="relative">
                  <div className="flex items-center gap-1.5 mb-2">
                    <label htmlFor="domain" className="text-sm font-medium">Desired Domain <span className="text-red-500 cursor-help" title="Required field">*</span></label>
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={(e) => { e.preventDefault(); setShowWhyPopup("domain"); }}
                    >?</button>
                  </div>
                  <div className="relative flex gap-2">
                    <Input
                      id="domain"
                      name="domain"
                      type="text"
                      placeholder="example.com"
                      className={`bg-background flex-1 ${errors.domain ? "border-red-500" : ""} ${
                        domainAvailability === "available" ? "border-green-500" : ""
                      } ${domainAvailability === "unavailable" ? "border-red-500" : ""}`}
                      value={formData.domain}
                      onChange={handleChange}
                      onBlur={() => { if (formData.domain.trim()) handleDomainSearch(); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleDomainSearch();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={`flex-shrink-0 hover:bg-primary/10 hover:border-primary/50 ${
                        errors.domainSearch ? "border-red-500 border-2 text-red-500" : ""
                      }`}
                      onClick={handleDomainSearch}
                      disabled={checkingDomain}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {errors.domain && <p className="text-red-500 text-xs mt-1">{errors.domain}</p>}
                  {checkingDomain && (
                    <p className="text-orange-500 text-xs mt-1 flex items-center gap-1">
                      Checking for availability...
                    </p>
                  )}
                  {!errors.domain && !checkingDomain && domainAvailability === "available" && (
                    <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      This domain is available!
                    </p>
                  )}
                  {!errors.domain && !checkingDomain && domainAvailability === "unavailable" && (
                    <p className="text-red-500 text-xs mt-1">
                      This domain is unavailable. Please try a different one.
                    </p>
                  )}
                  {errors.domainSearch && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      {errors.domainSearch}
                    </p>
                  )}
                </div>}

                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-2">
                    <label className="text-sm font-medium">Payment Plan <span className="text-red-500 cursor-help" title="Required field">*</span></label>
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={(e) => { e.preventDefault(); setShowWhyPopup("plan"); }}
                    >?</button>
                  </div>
                  <div className="relative">
                    {showPlanDropdown && (
                      <div className="fixed inset-0 z-[5]" onClick={() => setShowPlanDropdown(false)} />
                    )}
                    <button
                      type="button"
                      className={`w-full h-11 flex items-center justify-between bg-background border rounded-lg px-4 py-2 text-left text-base md:text-sm transition-all duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        errors.paymentPlan ? "border-red-500" : "border-input hover:border-primary/50"
                      }`}
                      onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                    >
                      <span className={formData.paymentPlan ? "text-foreground" : "text-muted-foreground"}>
                        {formData.paymentPlan || "Select a Plan"}
                      </span>
                      <svg
                        className={`w-4 h-4 text-muted-foreground transition-transform ${showPlanDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showPlanDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                        {formData.paymentPlan && (
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/50 transition-colors border-b border-border"
                            onClick={clearPlanSelection}
                          >
                            Clear selection
                          </button>
                        )}
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${
                            formData.paymentPlan === "Upfront" ? "bg-primary/10 text-primary" : ""
                          }`}
                          onClick={() => handlePlanSelect("Upfront")}
                        >
                          Upfront
                        </button>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${
                            formData.paymentPlan === "Monthly" ? "bg-primary/10 text-primary" : ""
                          }`}
                          onClick={() => handlePlanSelect("Monthly")}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors flex items-center gap-1.5 ${
                            formData.paymentPlan === "Hybrid" ? "bg-primary/10 text-primary" : ""
                          }`}
                          onClick={() => handlePlanSelect("Hybrid")}
                        >
                          Hybrid <span className="text-green-500" style={{fontSize:"0.6rem"}}>Save 10%</span>
                        </button>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors flex items-center gap-1.5 ${
                            formData.paymentPlan === "Annual" ? "bg-primary/10 text-primary" : ""
                          }`}
                          onClick={() => handlePlanSelect("Annual")}
                        >
                          Annual <span className="text-green-500" style={{fontSize:"0.6rem"}}>Save 20%</span>
                        </button>

                      </div>
                    )}
                  </div>
                  {errors.paymentPlan && <p className="text-red-500 text-xs mt-1">{errors.paymentPlan}</p>}
                </div>
                {(!formData.paymentPlan || formData.paymentPlan === "Upfront") && (
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Tell us about your project <span className="text-red-500 cursor-help" title="Required field">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Be as detailed as possible. Describe your business, design vision and ideas, site features, and any other specific requirements..."
                      className={`bg-background min-h-[150px] ${errors.message ? "border-red-500" : ""}`}
                      value={formData.message}
                      onChange={handleChange}
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>
                )}

                {/* Social Media Section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm font-medium">Social Media</span>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Recommended</span>
                    <button
                      type="button"
                      onClick={() => setShowWhyPopup("social")}
                      className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label="Why is this recommended?"
                    >?</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Instagram</span>
                        {validatingSocial.instagram && (
                          <span className="text-xs text-muted-foreground animate-pulse ml-1">Checking...</span>
                        )}
                        {socialValidated.instagram && !errors.instagram && formData.instagram && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex">
                        <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs">
                          instagram.com/
                        </span>
                        <Input
                          id="instagram"
                          name="instagram"
                          type="text"
                          placeholder="username"
                          className={`bg-background rounded-l-none ${errors.instagram ? "border-red-500" : ""}`}
                          value={formData.instagram}
                          onChange={handleChange}
                          onBlur={e => handleSocialBlur("instagram", e.target.value)}
                        />
                      </div>
                      {errors.instagram && <p className="text-red-500 text-xs mt-1">{errors.instagram}</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Facebook</span>
                        {validatingSocial.facebook && (
                          <span className="text-xs text-muted-foreground animate-pulse ml-1">Checking...</span>
                        )}
                        {socialValidated.facebook && !errors.facebook && formData.facebook && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex">
                        <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs">
                          facebook.com/
                        </span>
                        <Input
                          id="facebook"
                          name="facebook"
                          type="text"
                          placeholder="username"
                          className={`bg-background rounded-l-none ${errors.facebook ? "border-red-500" : ""}`}
                          value={formData.facebook}
                          onChange={handleChange}
                          onBlur={e => handleSocialBlur("facebook", e.target.value)}
                        />
                      </div>
                      {errors.facebook && <p className="text-red-500 text-xs mt-1">{errors.facebook}</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Twitter/X</span>
                        {validatingSocial.twitter && (
                          <span className="text-xs text-muted-foreground animate-pulse ml-1">Checking...</span>
                        )}
                        {socialValidated.twitter && !errors.twitter && formData.twitter && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex">
                        <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs">
                          x.com/
                        </span>
                        <Input
                          id="twitter"
                          name="twitter"
                          type="text"
                          placeholder="username"
                          className={`bg-background rounded-l-none ${errors.twitter ? "border-red-500" : ""}`}
                          value={formData.twitter}
                          onChange={handleChange}
                          onBlur={e => handleSocialBlur("twitter", e.target.value)}
                        />
                      </div>
                      {errors.twitter && <p className="text-red-500 text-xs mt-1">{errors.twitter}</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">YouTube</span>
                        {validatingSocial.youtube && (
                          <span className="text-xs text-muted-foreground animate-pulse ml-1">Checking...</span>
                        )}
                        {socialValidated.youtube && !errors.youtube && formData.youtube && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex">
                        <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs">
                          youtube.com/
                        </span>
                        <Input
                          id="youtube"
                          name="youtube"
                          type="text"
                          placeholder="username"
                          className={`bg-background rounded-l-none ${errors.youtube ? "border-red-500" : ""}`}
                          value={formData.youtube}
                          onChange={handleChange}
                          onBlur={e => handleSocialBlur("youtube", e.target.value)}
                        />
                      </div>
                      {errors.youtube && <p className="text-red-500 text-xs mt-1">{errors.youtube}</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">TikTok</span>
                        {validatingSocial.tiktok && (
                          <span className="text-xs text-muted-foreground animate-pulse ml-1">Checking...</span>
                        )}
                        {socialValidated.tiktok && !errors.tiktok && formData.tiktok && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex">
                        <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs">
                          tiktok.com/@
                        </span>
                        <Input
                          id="tiktok"
                          name="tiktok"
                          type="text"
                          placeholder="username"
                          className={`bg-background rounded-l-none ${errors.tiktok ? "border-red-500" : ""}`}
                          value={formData.tiktok}
                          onChange={handleChange}
                          onBlur={e => handleSocialBlur("tiktok", e.target.value)}
                        />
                      </div>
                      {errors.tiktok && <p className="text-red-500 text-xs mt-1">{errors.tiktok}</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">LinkedIn</span>
                        {validatingSocial.linkedin && (
                          <span className="text-xs text-muted-foreground animate-pulse ml-1">Checking...</span>
                        )}
                        {socialValidated.linkedin && !errors.linkedin && formData.linkedin && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex">
                        <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs">
                          linkedin.com/company/
                        </span>
                        <Input
                          id="linkedin"
                          name="linkedin"
                          type="text"
                          placeholder="company"
                          className={`bg-background rounded-l-none ${errors.linkedin ? "border-red-500" : ""}`}
                          value={formData.linkedin}
                          onChange={handleChange}
                          onBlur={e => handleSocialBlur("linkedin", e.target.value)}
                        />
                      </div>
                      {errors.linkedin && <p className="text-red-500 text-xs mt-1">{errors.linkedin}</p>}
                    </div>
                  </div>
                  <div className="mt-4 relative md:w-[calc(50%-0.5rem)]">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-muted-foreground">Google Business</span>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-4 h-4 ml-0.5 text-xs bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                        onClick={(e) => { e.preventDefault(); setShowWhyPopup("google"); }}
                      >?</button>
                      {validatingSocial.googleBusiness && (
                        <span className="text-xs text-muted-foreground animate-pulse ml-1">Checking...</span>
                      )}
                      {socialValidated.googleBusiness && !errors.googleBusiness && formData.googleBusiness && (
                        <Check className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    <Input
                      id="googleBusiness"
                      name="googleBusiness"
                      type="text"
                      placeholder="https://share.google/..."
                      className={`bg-background ${errors.googleBusiness ? "border-red-500" : ""}`}
                      value={formData.googleBusiness}
                      onChange={handleChange}
                      onBlur={e => handleSocialBlur("googleBusiness", e.target.value)}
                    />
                    {errors.googleBusiness && <p className="text-red-500 text-xs mt-1">{errors.googleBusiness}</p>}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <span className="flex items-center gap-1.5">
                      Attachments
                      <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Recommended</span>
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                        onClick={() => setShowAttachmentsHelp(true)}
                      >?</button>
                    </span>
                  </label>
                  {attachedFiles.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {attachedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                          <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          <span className="text-xs flex-1 truncate">{file.name}</span>
                          <button type="button" onClick={() => { setAttachedFiles(prev => prev.filter((_, j) => j !== i)); setFileErrors([]); }} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    {attachedFiles.length > 0 ? "Add more files" : "Click to attach files"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.webp,.heic,.svg,.gif,.pdf,.docx,.mov,.mp4,.otf,.ttf,.mp3,.wav,.zip,.html,.js,.css,.xlsx,.csv,.txt,.json"
                    className="hidden"
                    onChange={e => {
                      const newFiles = Array.from(e.target.files || []);
                      const combined = [...attachedFiles, ...newFiles];
                      const errs: string[] = [];
                      if (combined.length > 10) {
                        errs.push(`You can only attach up to 10 files. Please remove ${combined.length - 10} file(s).`);
                        setAttachedFiles(combined.slice(0, 10));
                      } else {
                        setAttachedFiles(combined);
                      }
                      const oversized = combined.filter(f => f.size > 50 * 1024 * 1024);
                      if (oversized.length > 0) {
                        errs.push(`The following file(s) exceed 50 MB and must be removed: ${oversized.map(f => f.name).join(", ")}.`);
                      }
                      setFileErrors(errs);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                  {fileErrors.map((err, i) => (
                    <p key={i} className="text-red-500 text-xs mt-1">{err}</p>
                  ))}
                  <p className="text-xs text-muted-foreground mt-1.5">Max. 50 MB per file.</p>
                </div>

                {/* Security Disclaimer */}
                <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl border border-border/50">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Your information is secure with us.</span>{" "}
                      We use industry-standard encryption and never share your data with third parties.
                      See our <button type="button" onClick={() => window.dispatchEvent(new Event('openPrivacyPolicy'))} className="text-primary hover:underline">Privacy Policy</button> for details.
                    </p>
                  </div>
                </div>

                {errors.submit && (
                  <p className="text-sm text-red-500 text-center -mt-2"><ErrorWithEmail msg={errors.submit} /></p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : isMultiStepPlan ? "Next" : "Send Message"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>

              {/* ── Step 2: Page Content ── */}
              {formStep === 2 && (
                <div className="mt-0">
                  {([
                    { title: "Home", fields: [
                      { k: "homeValueProp" as const, n: "homeKeyMessage", label: "What is your key message or value proposition?", ph: "The text you want visitors to see first" },
                      { k: "homeAction" as const, n: "homeAction", label: "What action do you want visitors to take on this page?", ph: "e.g., call, book, buy, sign up" },
                    ]},
                    { title: "About", fields: [
                      { k: "aboutBusiness" as const, n: "aboutStory", label: "How did your business start, what do you do, and who do you serve?", ph: "e.g. origins, year of establishment, mission statement" },
                      { k: "aboutUnique" as const, n: "aboutUnique", label: "What sets you apart from competitors? What's your unique story?", ph: "Why visitors should choose you over competitors" },
                    ]},
                    { title: "Services / Products", fields: [
                      { k: "servicesInfo" as const, n: "servicesProducts", label: "What are your services or products?", ph: "e.g. names, descriptions, pricing" },
                      { k: "servicesOffers" as const, n: "specialOffers", label: "Any special offers, packages, or promotions you want highlighted?", ph: "e.g. discounts, bundles, limited-time deals" },
                    ]},
                    { title: "Contact", fields: [
                      { k: "contactMethods" as const, n: "contactMethods", label: "What contact methods do you want available?", ph: "e.g., phone, email, contact form, live chat" },
                      { k: "contactHours" as const, n: "businessHours", label: "What are your business hours and preferred response time?", ph: "e.g., Mon–Fri 9AM–5PM EST, reply within 24hrs" },
                    ]},
                  ] as Array<{ title: string; fields: Array<{ k: keyof typeof step2Data; n: string; label: string; ph: string; optional?: boolean }> }>).map(({ title, fields }) => (
                    <div key={title} className="mb-6">
                      <h4 className="text-base font-semibold mb-3 pb-2 border-b border-border/50">{title}</h4>
                      <div className="space-y-3">
                        {fields.map(({ k, n, label, ph, optional }) => (
                          <div key={k}>
                            <label className="block text-sm font-medium mb-1">
                              {label} {!optional && <span className="text-red-500">*</span>}
                            </label>
                            <Textarea
                              name={n}
                              className="bg-background min-h-[60px] text-sm"
                              placeholder={ph}
                              value={(step2Data[k] as string) || ""}
                              onChange={e => setStep2Data(prev => ({ ...prev, [k]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Additional Pages */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                      <h4 className="text-base font-semibold">Additional Pages</h4>
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                        onClick={() => setShowAdditionalPagesHelp(true)}
                      >?</button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Select any additional pages you&apos;d like included on your website.</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        "Testimonials / Reviews","Portfolio","FAQ","Pricing",
                        "Appointments / Reservations","Meet the Team",
                        "Blog / News","Newsletter / Email Signup","Resources / Downloads",
                        "Announcements / Updates","Press / Media Kit","Photo / Video Gallery",
                        "Case Studies","Tour","Merchandise","Music","Events",
                        "Affiliates / Partners / Relations","Privacy Policy","Terms of Service",
                        "Cookie Policy","Return Policy","Refund Policy","404 / Error Page",
                        "Thank You / Confirmation Page","Contact Form",
                        "Coming Soon / Under Maintenance","Online Store / Catalog",
                        "Delivery / Shipping / Warranty","Shopping Cart","Checkout Page",
                        "Dashboard","Account / Login / Member Portal","Help Center / Support",
                        "Community / Forum / Docs","Locations / Service Areas",
                        "Map Embed","Podcast / Audio","Menu","Live Chat","Order Online",
                        "Hours of Operation","Listings","Virtual Tour","Careers / Jobs",
                        "Donation / Volunteer / Fundraising","Programs","Wholesale / Franchise",
                      ].map((page) => (
                        <label key={page} className="flex items-start gap-2 text-sm cursor-pointer select-none">
                          <input
                            type="checkbox"
                            name="additionalPages"
                            className="w-4 h-4 mt-0.5 flex-shrink-0 accent-primary"
                            checked={step2Data.additionalPages.includes(page)}
                            onChange={e => {
                              setStep2Data(prev => ({
                                ...prev,
                                additionalPages: e.target.checked
                                  ? [...prev.additionalPages, page]
                                  : prev.additionalPages.filter(p => p !== page),
                              }));
                            }}
                          />
                          <span className="text-muted-foreground leading-snug">{page}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1.5">Additional Details</label>
                      <Textarea
                        name="additionalDetails"
                        className="bg-background min-h-[80px]"
                        placeholder="Describe what you need on any of the pages selected above, or specify any pages not listed."
                        value={step2Data.additionalPagesDetails}
                        onChange={e => setStep2Data(prev => ({ ...prev, additionalPagesDetails: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Security box */}
                  <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl border border-border/50 mb-6">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Your information is secure with us.</span>{" "}
                        We use industry-standard encryption and never share your data with third parties.{" "}
                        See our <button type="button" onClick={() => window.dispatchEvent(new Event('openPrivacyPolicy'))} className="text-primary hover:underline">Privacy Policy</button> for details.
                      </p>
                    </div>
                  </div>

                  {errors.submit && (
                    <p className="text-sm text-red-500 text-center mb-4"><ErrorWithEmail msg={errors.submit} /></p>
                  )}

                  <Button
                    type="button"
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6 mb-3"
                    disabled={isSubmitting}
                    onClick={handleSubmit as unknown as React.MouseEventHandler}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-6 text-base"
                    onClick={() => { setFormStep(1); setTimeout(() => scrollToSection("contact"), 50); }}
                  >
                    Back
                  </Button>
                </div>
              )}
            </>)}
          </Card>
        </div>
      </div>

      {/* Additional Pages help popup */}
      {showAdditionalPagesHelp && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAdditionalPagesHelp(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold pr-2">Unsure which pages to choose?</h3>
              <button type="button" onClick={() => setShowAdditionalPagesHelp(false)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Choose what you&apos;re familiar with and what sounds relevant to your business — there&apos;s no need to overthink it. We&apos;ll review your selections and add any pages we think are necessary based on your business type and industry, so nothing important gets left out.
            </p>
            <button
              type="button"
              onClick={() => setShowAdditionalPagesHelp(false)}
              className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {showAttachmentsHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAttachmentsHelp(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold pr-2">Why?</h3>
              <button type="button" onClick={() => setShowAttachmentsHelp(false)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Uploading your logo, gallery media, fonts, brand colors, animations, etc. will help our team design the best website possible for your brand.
            </p>
            <button type="button" onClick={() => setShowAttachmentsHelp(false)}
              className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Unified Why? popup */}
      {showWhyPopup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowWhyPopup(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold pr-2">
                {showWhyPopup === "domain" ? "What is a domain?" : showWhyPopup === "phone" ? "Work, Home, or Mobile?" : showWhyPopup === "plan" ? "Unsure?" : showWhyPopup === "google" ? "Where do I find this link?" : showWhyPopup === "ownsDomain" ? "What is this for?" : "Why?"}
              </h3>
              <button type="button" onClick={() => setShowWhyPopup(null)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {showWhyPopup === "company" && (
                <p>Providing your company name helps our team understand your business better and create a more tailored website design that aligns with your brand and industry.</p>
              )}
              {showWhyPopup === "social" && (
                <p>Sharing your social media profiles gives our team extra resources about your brand, helping us design a website that stays consistent with your existing online presence.</p>
              )}
              {showWhyPopup === "phone" && (
                <p>Enter the phone number you are best reached by — our team may reach out via texts or calls to discuss your project.</p>
              )}
              {showWhyPopup === "plan" && (
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                    onClick={() => { setShowWhyPopup(null); scrollToSection("pricing"); }}
                  >
                    View pricing options <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              {showWhyPopup === "domain" && (
                <div>
                  <p className="mb-3">A domain is your website&apos;s address on the internet (e.g., mybusiness.com). It&apos;s how customers find you online.</p>
                  <p className="font-semibold text-foreground mb-2">Popular extensions:</p>
                  <ul className="space-y-1 text-xs mb-3">
                    <li><span className="text-primary font-medium">.com</span> — Most popular, great for businesses</li>
                    <li><span className="text-primary font-medium">.org</span> — Non-profits &amp; organizations</li>
                    <li><span className="text-primary font-medium">.net</span> — Tech &amp; network companies</li>
                    <li><span className="text-primary font-medium">.shop</span> — Online stores</li>
                    <li><span className="text-primary font-medium">.io</span> — Tech startups &amp; SaaS</li>
                    <li><span className="text-primary font-medium">.co</span> — Modern alternative to .com</li>
                    <li><span className="text-primary font-medium">.edu</span> — Educational institutions</li>
                    <li><span className="text-primary font-medium">.gov</span> — Government entities</li>
                  </ul>
                  <p className="text-xs border-t border-border/50 pt-2">GimmeASite uses Instant Domain Search to check availability. Please note that the availability check is not 100% accurate — your chosen domain may need to be adjusted later in the process.</p>
                </div>
              )}
              {showWhyPopup === "ownsDomain" && (
                <div className="space-y-3">
                  <p>Check this box if we&apos;re redesigning your existing site and you want to keep your current domain.</p>
                  <p>Already owning your domain will result in <span className="text-green-500 font-semibold">savings</span> for you, as a reduced price will apply since we won&apos;t need to acquire it on your behalf.</p>
                  <p>Do <span className="font-semibold text-foreground">not</span> check this box if:</p>
                  <ul className="space-y-1.5 text-xs list-none">
                    <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">a.</span> We&apos;re redesigning your site and you want a brand new domain instead.</li>
                    <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">b.</span> This is your first website and you don&apos;t own a domain yet.</li>
                  </ul>
                </div>
              )}
              {showWhyPopup === "google" && (
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Search for your business name on Google</li>
                  <li>Locate your Business Profile in the Knowledge Panel</li>
                  <li>Click the Share button beneath your business name</li>
                  <li>Click to copy link, and paste it in the textbox.</li>
                </ol>
              )}
            </div>
            {showWhyPopup !== "plan" && (
              <button
                type="button"
                onClick={() => setShowWhyPopup(null)}
                className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Got It
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// Footer
function Footer({ onOpenPrivacyPolicy }: { onOpenPrivacyPolicy: () => void }) {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);

  // Sync with external privacy policy and terms of service triggers
  useEffect(() => {
    const handleOpenPrivacy = () => setShowPrivacyPolicy(true);
    const handleOpenTerms = () => setShowTermsOfService(true);
    window.addEventListener('openPrivacyPolicy', handleOpenPrivacy);
    window.addEventListener('openTermsOfService', handleOpenTerms);
    return () => {
      window.removeEventListener('openPrivacyPolicy', handleOpenPrivacy);
      window.removeEventListener('openTermsOfService', handleOpenTerms);
    };
  }, []);

  return (
    <>
      <footer id="footer" className="py-16 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img src="/favicon.svg" alt="GimmeASite" className="w-10 h-10" />
                <span className="text-xl font-bold tracking-tight">GimmeASite</span>
              </Link>
              <p className="text-muted-foreground mb-6">
                Professional web design agency creating stunning websites for businesses worldwide.
              </p>
              <div className="text-sm text-muted-foreground">
                © 2026 GimmeASite. All rights reserved.
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><button type="button" onClick={() => { scrollToSection("services"); setTimeout(() => window.dispatchEvent(new CustomEvent("highlightService", { detail: "Website Design" })), 600); }} className="hover:text-foreground transition-colors">Website Design</button></li>
                <li><button type="button" onClick={() => { scrollToSection("services"); setTimeout(() => window.dispatchEvent(new CustomEvent("highlightService", { detail: "Hosting" })), 600); }} className="hover:text-foreground transition-colors">Hosting</button></li>
                <li><button type="button" onClick={() => { scrollToSection("services"); setTimeout(() => window.dispatchEvent(new CustomEvent("highlightService", { detail: "Maintenance" })), 600); }} className="hover:text-foreground transition-colors">Maintenance</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><button type="button" onClick={() => scrollToSection("pricing")} className="hover:text-foreground transition-colors">Plans</button></li>
                <li><button type="button" onClick={() => scrollToSection("faq")} className="hover:text-foreground transition-colors">FAQ</button></li>
                <li><button type="button" onClick={() => scrollToSection("contact")} className="hover:text-foreground transition-colors">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link
                    href="/privacy-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPrivacyPolicy(true);
                    }}
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsOfService(true);
                    }}
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowCookiePolicy(true)}
                    className="hover:text-foreground transition-colors"
                  >
                    Cookie Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="mb-8" />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Design with passion
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/gimmeasite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com/@gimmeasite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-primary transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPrivacyPolicy(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-slideIn">
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Privacy Policy</h3>
            <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
              <p><strong className="text-foreground">Last Updated:</strong> April 2026</p>

              <p>GimmeASite ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our services.</p>

              <h4 className="text-foreground font-semibold mt-6">Information We Collect</h4>
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name and contact information (email, phone number)</li>
                <li>Company/business information</li>
                <li>Project details and requirements</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>

              <h4 className="text-foreground font-semibold mt-6">How We Use Your Information</h4>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Communicate with you about projects, updates, and support</li>
                <li>Process payments and send invoices</li>
                <li>Respond to your inquiries and requests</li>
              </ul>

              <h4 className="text-foreground font-semibold mt-6">Information Sharing</h4>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information only with service providers who assist us in operating our business, and only as necessary to provide our services to you.</p>

              <h4 className="text-foreground font-semibold mt-6">Data Security</h4>
              <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

              <h4 className="text-foreground font-semibold mt-6">Contact Us</h4>
              <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:hello@gimmeasite.com" className="text-primary hover:underline">hello@gimmeasite.com</a>.</p>
            </div>
            <div className="mt-6 text-center">
              <Button onClick={() => setShowPrivacyPolicy(false)} className="bg-primary hover:bg-primary/90">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTermsOfService(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-slideIn">
            <button
              type="button"
              onClick={() => setShowTermsOfService(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Terms of Service</h3>
            <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
              <p><strong className="text-foreground">Last Updated:</strong> June 2026</p>

              <p>Welcome to GimmeASite. By using our services, you agree to be bound by these Terms of Service.</p>

              <h4 className="text-foreground font-semibold mt-6">Services</h4>
              <p>GimmeASite provides web design and development services. The specific scope of work will be outlined in individual project agreements or quotes provided to you.</p>

              <h4 className="text-foreground font-semibold mt-6">Payment Terms</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment is required as specified in your project agreement</li>
                <li>For subscriptions, recurring payments will be charged on the agreed billing date</li>
                <li>Upfront fees are due upon project completion unless otherwise agreed</li>
              </ul>

              <h4 className="text-foreground font-semibold mt-6">Intellectual Property</h4>
              <p>GimmeASite retains all intellectual property rights to websites, designs, and code produced under our services. Upon receipt of full payment, clients are granted a limited, non-exclusive license to use and display the delivered website for its intended commercial purpose. Full transfer of ownership rights is included as part of every service Plan. We reserve the right to display delivered work in our portfolio unless a written opt-out is agreed upon.</p>

              <h4 className="text-foreground font-semibold mt-6">Revisions and Support</h4>
              <p>Each project includes a reasonable number of revisions as specified in your Plan, as well as a designated support period. Additional revisions and continued support outside of your Plan may incur extra charges.</p>

              <h4 className="text-foreground font-semibold mt-6">Add-Ons</h4>
              <p>GimmeASite offers optional add-on services that extend or supplement your Plan. Available add-ons include, but are not limited to: Revision Refills, Redesign Requests, Domain Changes, Transfer of Ownership, and Upfront Support Renewals. Add-ons are requested through our ticketing system and are subject to availability and pricing at the time of the request. A small additional fee may apply upon resolution, and we will always confirm pricing with you before any charge is made. Some add-ons may be included at no extra cost depending on your Plan.</p>

              <h4 className="text-foreground font-semibold mt-6">Limitation of Liability</h4>
              <p>GimmeASite's liability is limited to the amount paid for services. We are not liable for indirect, incidental, or consequential damages.</p>

              <h4 className="text-foreground font-semibold mt-6">Service Availability and Technical Issues</h4>
              <p>GimmeASite makes no warranties regarding the uninterrupted availability, error-free operation, or absolute security of any website we deliver. We are not responsible for losses arising from security incidents caused by third parties, technical issues resulting from browser or platform updates outside our control, hosting or DNS outages, or reliance on content displayed on a delivered website. Our total liability shall not exceed the fees paid for the specific service giving rise to the claim.</p>

              <h4 className="text-foreground font-semibold mt-6">Refund Policy</h4>
              <p>All sales are final. GimmeASite does not offer refunds once payment has been processed. For subscribers, you may cancel your subscription at any time to prevent future charges, but no refunds will be issued for the current or any prior billing periods. If you are dissatisfied with your site prior to payment, we will work with you to make it right before any transaction takes place.</p>

              <h4 className="text-foreground font-semibold mt-6">Automated Processes</h4>
              <p>Client acknowledges that certain services may be delivered in whole or in part through automated, algorithmic, or machine-driven processes. The use of such processes does not diminish the quality, ownership rights, or agreed scope of the work delivered.</p>

              <h4 className="text-foreground font-semibold mt-6">Contact</h4>
              <p>For questions about these terms, contact us at <a href="mailto:hello@gimmeasite.com" className="text-primary hover:underline">hello@gimmeasite.com</a>.</p>
            </div>
            <div className="mt-6 text-center">
              <Button onClick={() => setShowTermsOfService(false)} className="bg-primary hover:bg-primary/90">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Policy Modal */}
      {showCookiePolicy && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCookiePolicy(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-slideIn">
            <button
              type="button"
              onClick={() => setShowCookiePolicy(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Cookie Policy</h3>
            <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
              <p><strong className="text-foreground">Last Updated:</strong> April 2026</p>

              <p>This Cookie Policy explains how GimmeASite uses cookies and similar technologies on our website.</p>

              <h4 className="text-foreground font-semibold mt-6">What Are Cookies?</h4>
              <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience.</p>

              <h4 className="text-foreground font-semibold mt-6">How We Use Cookies</h4>
              <p>We use cookies for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-foreground">Essential Cookies:</strong> Required for basic website functionality</li>
                <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how visitors interact with our site</li>
                <li><strong className="text-foreground">Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>

              <h4 className="text-foreground font-semibold mt-6">Third-Party Cookies</h4>
              <p>We may use third-party services (such as analytics providers) that set their own cookies. These are governed by their respective privacy policies.</p>

              <h4 className="text-foreground font-semibold mt-6">Managing Cookies</h4>
              <p>You can control cookies through your browser settings. Note that disabling certain cookies may affect website functionality.</p>

              <h4 className="text-foreground font-semibold mt-6">Updates to This Policy</h4>
              <p>We may update this Cookie Policy periodically. Please check back for any changes.</p>

              <h4 className="text-foreground font-semibold mt-6">Contact</h4>
              <p>For questions about our use of cookies, contact us at <a href="mailto:hello@gimmeasite.com" className="text-primary hover:underline">hello@gimmeasite.com</a>.</p>
            </div>
            <div className="mt-6 text-center">
              <Button onClick={() => setShowCookiePolicy(false)} className="bg-primary hover:bg-primary/90">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Promotional Pop-up Component
function PromoPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the pop-up has already been dismissed in this session
    const isDismissed = sessionStorage.getItem('promoPopupDismissed');
    if (isDismissed) return;

    // Show pop-up after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('promoPopupDismissed', 'true');
  };

  const handleGetQuote = () => {
    handleClose();
    scrollToSection('contact');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slideIn">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Get Your Free Draft!</h3>
          <p className="text-muted-foreground mb-6">
            Ready to transform your online presence? We'll create a personalized draft tailored to your business needs — completely free, no strings attached.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleGetQuote}
              className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
            >
              Yes, please!
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <button
              type="button"
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              No, I don't want an awesome site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment Success/Cancelled Toast
function PaymentStatusToast({ status, onClose }: { status: "success" | "cancelled" | null; onClose: () => void }) {
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!status) return null;

  return (
    <div className="fixed top-24 right-4 z-50 animate-slideIn">
      <div className={`${
        status === "success"
          ? "bg-green-500/90"
          : "bg-amber-500/90"
      } backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 max-w-sm`}>
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          {status === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </div>
        <div>
          {status === "success" ? (
            <>
              <p className="font-semibold">Payment Successful!</p>
              <p className="text-sm text-white/90">Thank you! We'll be in touch within 24 hours.</p>
            </>
          ) : (
            <>
              <p className="font-semibold">Payment Cancelled</p>
              <p className="text-sm text-white/90">No worries! Feel free to try again when ready.</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Main Page Component
// Thanks Popup Component
function ThanksPopup({ isOpen, onClose, onBookCall }: { isOpen: boolean; onClose: () => void; onBookCall: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slideIn">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
          <p className="text-muted-foreground mb-6">
            We've received your message and will get back to you within 24 business hours. We're excited to help bring your vision to life!
          </p>
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 w-full px-8"
          >
            <a
              href="https://calendar.app.google/wQdwGP7Trr5ThAKn6"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { onBookCall(); onClose(); }}
            >
              Book a Call to Review Your Draft
            </a>
          </Button>
          <p className="text-xs text-muted-foreground/70 text-center mt-2 leading-snug">
            Drafts are completed within one business day, and you cannot book us within 24 hours of your meeting — Your draft will be ready.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showThanksPopup, setShowThanksPopup] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPlanType, setPaymentPlanType] = useState<"one-time" | "monthly" | "hybrid">("one-time");
  const [paymentBillingCycle, setPaymentBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [paymentStatus, setPaymentStatus] = useState<"success" | "cancelled" | null>(null);
  const [bookCallClicked, setBookCallClicked] = useState(false);

  // Warn before tab close if ThanksPopup open but Book Call not clicked
  useEffect(() => {
    if (showThanksPopup && !bookCallClicked) {
      const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [showThanksPopup, bookCallClicked]);

  // Handle URL parameters for payment status and modals
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get("payment");
    const modal = urlParams.get("modal");

    if (payment === "success") {
      setPaymentStatus("success");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === "cancelled") {
      setPaymentStatus("cancelled");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Handle modal triggers from URL
    if (modal === "privacy-policy") {
      window.dispatchEvent(new Event("openPrivacyPolicy"));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (modal === "terms-of-service") {
      window.dispatchEvent(new Event("openTermsOfService"));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (modal === "faq") {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => scrollToSection("faq"), 100);
    } else if (modal === "payment-upfront" || modal === "payment-one-time") {
      // Scroll to pricing section first, then open modal
      setTimeout(() => {
        scrollToSection("pricing");
        setTimeout(() => {
          setPaymentPlanType("one-time");
          setPaymentModalOpen(true);
        }, 300);
      }, 100);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (modal === "payment-monthly") {
      setTimeout(() => {
        scrollToSection("pricing");
        setTimeout(() => {
          setPaymentPlanType("monthly");
          setPaymentBillingCycle("monthly");
          setPaymentModalOpen(true);
        }, 300);
      }, 100);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (modal === "payment-annual") {
      setTimeout(() => {
        scrollToSection("pricing");
        setTimeout(() => {
          setPaymentPlanType("monthly");
          setPaymentBillingCycle("annual");
          setPaymentModalOpen(true);
        }, 300);
      }, 100);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (modal === "payment-hybrid") {
      setTimeout(() => {
        scrollToSection("pricing");
        setTimeout(() => {
          setPaymentPlanType("hybrid");
          setPaymentModalOpen(true);
        }, 300);
      }, 100);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Handle contact modal — keeps URL as gimmeasite.com
    if (modal === "contact") {
      window.history.replaceState({}, document.title, "/");
      setTimeout(() => scrollToSection("contact"), 100);
    }

    // Handle hash for contact section scroll
    if (window.location.hash === "#contact") {
      setTimeout(() => {
        scrollToSection("contact");
      }, 100);
    }

    // Handle ?thanks=1 (from /thank-you route) and legacy #thanks hash
    if (urlParams.get("thanks") === "1" || window.location.hash === "#thanks") {
      setShowThanksPopup(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Handle ?scroll= param (from /about and /pricing routes)
    const scroll = urlParams.get("scroll");
    if (scroll === "about" || scroll === "pricing") {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => scrollToSection(scroll), 100);
    }
  }, []);

  const handleOpenPrivacyPolicy = () => {
    window.dispatchEvent(new Event('openPrivacyPolicy'));
  };

  const handleOpenPayment = (plan: "one-time" | "monthly" | "hybrid", billing: "monthly" | "annual" = "monthly") => {
    setPaymentPlanType(plan);
    setPaymentBillingCycle(billing);
    setPaymentModalOpen(true);
  };

  const handleClosePayment = () => {
    setPaymentModalOpen(false);
  };

  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
      <PricingSection onOpenPayment={handleOpenPayment} />
      <FaqSection />
      <ContactSection onSuccess={() => setShowThanksPopup(true)} />
      <Footer onOpenPrivacyPolicy={handleOpenPrivacyPolicy} />
      <ThanksPopup isOpen={showThanksPopup} onClose={() => setShowThanksPopup(false)} onBookCall={() => setBookCallClicked(true)} />
      <PromoPopup />
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={handleClosePayment}
        planType={paymentPlanType}
        billingCycle={paymentBillingCycle}
      />
      <PaymentStatusToast
        status={paymentStatus}
        onClose={() => setPaymentStatus(null)}
      />
    </main>
  );
}
