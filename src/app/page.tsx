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
  HelpCircle,
  Shield,
  Loader2,
  Search,
  Server,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PaymentModal } from "@/components/PaymentModal";

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
    answer: "We value expedited services at GimmeASite. All sites are completed in up to five business days depending on complexity. However, some sites can even be delivered same-day!",
  },
  {
    question: "What's included in the plans?",
    answer: "All plans include custom design, hosting, maintenance / revisions, the support period specified in each plan, etc.",
  },
  {
    question: "Can I update my site myself?",
    answer: "Unfortunately, for now, that is not an option. However, don't fret! We are currently working on a content management system (CMS) plan that allows you to update text and images whenever you please. We will be announcing more details on this soon.",
  },
  {
    question: "What if I need revisions to my site?",
    answer: "A different amount of revisions are included in each plan. You can make your revision request known to us by emailing support. Requesting extra revisions or full, large-scale redesigns may incur additional fees.",
  },
  {
    question: "Where do I manage my subscription?",
    answer: <>You can manage your subscription, update payment methods, and view invoices at <a href="/billing" className="text-primary hover:underline font-medium">gimmeasite.com/billing</a>.</>,
  },
];

// FAQ Popup Component
function FaqPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Reset the open question whenever the popup is closed
  useEffect(() => {
    if (!isOpen) {
      setOpenIndex(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-slideIn">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Frequently Asked Questions</h3>
          <p className="text-muted-foreground">
            Find answers to your common questions below.
          </p>
        </div>

        <div className="space-y-3 mb-8">
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
                    <p className="text-sm text-muted-foreground px-4 pb-4">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="mb-6" />

        <div className="text-center">
          <p className="text-muted-foreground mb-3">
            Still have questions? We're here to help!
          </p>
          <a
            href="mailto:hello@gimmeasite.com"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            <Mail className="w-4 h-4" />
            hello@gimmeasite.com
          </a>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90"
          >
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
}

// Navigation Component
function Navigation({ onOpenFaq }: { onOpenFaq: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountPopup, setShowAccountPopup] = useState(false);

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/favicon.svg" alt="GimmeASite" className="w-10 h-10" />
              <span className="text-xl font-bold tracking-tight">GimmeASite</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <button type="button" onClick={() => handleNavClick("services")} className="text-muted-foreground hover:text-foreground transition-colors">Services</button>
              <button type="button" onClick={() => handleNavClick("process")} className="text-muted-foreground hover:text-foreground transition-colors">Process</button>
              <button type="button" onClick={() => handleNavClick("about")} className="text-muted-foreground hover:text-foreground transition-colors">About</button>
              <button type="button" onClick={() => handleNavClick("pricing")} className="text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
              <button type="button" onClick={() => handleNavClick("contact")} className="text-muted-foreground hover:text-foreground transition-colors">Contact</button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={onOpenFaq}
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
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
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <button
              type="button"
              className="md:hidden p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-4">
              <button type="button" onClick={() => handleNavClick("services")} className="block py-2 text-muted-foreground hover:text-foreground w-full text-left">Services</button>
              <button type="button" onClick={() => handleNavClick("process")} className="block py-2 text-muted-foreground hover:text-foreground w-full text-left">Process</button>
              <button type="button" onClick={() => handleNavClick("about")} className="block py-2 text-muted-foreground hover:text-foreground w-full text-left">About</button>
              <button type="button" onClick={() => handleNavClick("pricing")} className="block py-2 text-muted-foreground hover:text-foreground w-full text-left">Pricing</button>
              <button type="button" onClick={() => handleNavClick("contact")} className="block py-2 text-muted-foreground hover:text-foreground w-full text-left">Contact</button>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={onOpenFaq}>
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Help
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setIsOpen(false); setShowAccountPopup(true); }}>
                  <UserCircle className="w-4 h-4 mr-1" />
                  Account
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => handleNavClick("contact")}>Get Started</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Account popup */}
      {showAccountPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAccountPopup(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Account</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              You will be taken to your billing portal, where you can manage your subscription, update your payment method, and view invoices.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              <span className="font-medium text-foreground">Note:</span> An account is only created for you after your first payment is processed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAccountPopup(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => { window.location.href = "https://account.gimmeasite.com/p/login/dRmfZjaqK6e87c6gsz0co00"; }}
              >
                Proceed
                <ArrowRight className="w-4 h-4 ml-2" />
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
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden grid-pattern noise-bg">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.9] mb-8 animate-slideIn opacity-0 stagger-2">
            We Build
            <br />
            <span className="gradient-text">Stunning Websites</span>
            <br />
            That Convert
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slideIn opacity-0 stagger-3">
            Transform your business with a professional website that captures attention and drives results. Fast, affordable, and designed to grow with you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideIn opacity-0 stagger-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 animate-glow" onClick={() => scrollToSection("contact")}>
              Get Your Free Draft
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground animate-slideIn opacity-0 stagger-5">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>No Hidden Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>Expedited Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>Quality Guaranteed</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-12 animate-slideIn opacity-0 stagger-6">
          {[
            { number: "100+", label: "Website Templates" },
            { number: "97%", label: "Customer Satisfaction" },
            { number: "~25", label: "Available Countries" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.number}</div>
              <div className="text-muted-foreground">{stat.label}</div>
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
      features: ["Responsive Design", "Creative Layout", "Fast Loading"],
    },
    {
      icon: Server,
      title: "Hosting",
      description: "Fast, reliable hosting that keeps your website online and loading quickly around the clock.",
      features: ["99.9% Uptime", "SSL", "Domain"],
    },
    {
      icon: Zap,
      title: "Maintenance",
      description: "Keep your website secure, updated, and performing at its best 24/7.",
      features: ["Security Updates", "Performance", "Backups"],
    },
  ];

  return (
    <section id="services" className="py-20 relative noise-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Our Services</Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Everything You Need to
            <br />
            <span className="gradient-text">Succeed Online</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            From concept to deploy and beyond, we provide comprehensive web solutions for businesses of all sizes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={service.title}
              className="p-8 bg-card/50 border-border/50 hover-lift card-shine group cursor-pointer"
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
  );
}

// Process Section
function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Discovery",
      description: "Either we discover you or you discover us, followed by us researching your background to create a foundation.",
    },
    {
      number: "02",
      title: "Design",
      description: "Our designers draft beautiful sites that align with your brand and user experience goals.",
    },
    {
      number: "03",
      title: "Development",
      description: "Once you approve of your free draft, we make any last-minute changes necessary before testing functionality.",
    },
    {
      number: "04",
      title: "Deploy",
      description: "After thorough testing, we deploy your site to the world and provide ongoing support. Conditions may apply.",
    },
  ];

  return (
    <section id="process" className="py-32 relative noise-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Our Process</Badge>
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
            <div key={step.number} className="relative">
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
    <section id="about" className="py-20 relative noise-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">About Us</Badge>
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
              Matthew and Christopher became friends in high school, but later began this project in 2025 as college students to deliver websites in an unusually expedited fashion to businesses of all types and sizes. They continue to focus on improving the online presence and customer outreach of their clients, as their drive for web design inspired them to create professional websites while slowly expanding into broader marketing endeavors.
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
  const [monthlyBilling, setMonthlyBilling] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Upfront",
      price: "Contact us",
      priceLabel: "for more information",
      description: "",
      features: [
        "Custom Design",
        "SSL + Security Integration",
        "Performance Optimization",
        "Free Draft Before Payment",
        "3 Total Revisions",
      ],
      popular: false,
    },
    {
      name: "Monthly",
      price: "Contact us",
      priceLabel: "for more information",
      description: "Everything in __Upfront__, including:",
      features: [
        "Advanced Security",
        "2 Revisions Per Month",
        "Priority Ongoing Support",
        "Analytics Dashboard",
      ],
      popular: true,
    },
    {
      name: "Equity / CMS",
      price: "Contact us",
      priceLabel: "for more information",
      description: "",
      features: [],
      popular: false,
      hasTooltip: true,
    },
  ];

  return (
    <section id="pricing" className="py-32 relative noise-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Transparent Pricing,
            <br />
            <span className="gradient-text">No Surprises</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your business. All plans include our quality and satisfaction guaranteed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 relative group ${
                plan.popular
                  ? "bg-primary/5 border-primary/30 animate-attention-bounce"
                  : "bg-card/50 border-border/50"
              } hover-lift`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-2xl font-bold">
                  {plan.name === "Monthly" ? (monthlyBilling === "annual" ? "Annual" : "Monthly") : plan.name}
                </h3>
                {plan.name === "Monthly" && (
                  <div className="flex items-center gap-1.5 ml-1">
                    {monthlyBilling === "monthly" ? (
                      <button
                        type="button"
                        onClick={() => setMonthlyBilling("annual")}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Annual <span className="text-xs text-green-400">Save 15%</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMonthlyBilling("monthly")}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Monthly
                      </button>
                    )}
                  </div>
                )}
                {plan.name === "Equity / CMS" && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-5 h-5 text-xs bg-muted rounded-full hover:bg-primary/20 transition-colors"
                    onClick={() => setShowEquityCmsPopup(true)}
                  >
                    ?
                  </button>
                )}
              </div>
              <div className="mb-4">
                <button
                  type="button"
                  className="text-3xl font-extrabold text-primary hover:underline"
                  onClick={() => scrollToSection("contact")}
                >
                  {plan.price}
                </button>
                <span className="text-muted-foreground"> {plan.priceLabel}</span>
              </div>
              {plan.description && (
                <p className="text-muted-foreground mb-4 font-medium">
                  {plan.name === "Monthly"
                    ? <span>Everything in <strong>{monthlyBilling === "annual" ? "Monthly" : "Upfront"}</strong>, including:</span>
                    : plan.description}
                </p>
              )}
              <Separator className="mb-6" />
              {plan.features.length > 0 || plan.name === "Monthly" ? (
                <div className="space-y-3 mb-8">
                  {(plan.name === "Monthly" && monthlyBilling === "annual"
                    ? [...plan.features.filter((f: string) => !["Advanced Security", "Priority Ongoing Support", "Analytics Dashboard", "2 Revisions Per Month"].includes(f)), "Unlimited Revisions", "__sub__Full Redesigns", "Real-Time Analytics", "Subdomain Configuration"]
                    : plan.features
                  ).map((feature: string) => (
                    feature.startsWith("__sub__") ? (
                      <div key={feature} className="flex items-center gap-3 pl-6">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature.replace("__sub__", "")}</span>
                      </div>
                    ) : (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="mb-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-8 text-center">
                  <Zap className="w-7 h-7 text-primary mx-auto mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-foreground mb-1">Something special is brewing</p>
                  <p className="text-xs text-muted-foreground">Exciting perks are on the way — stay tuned.</p>
                </div>
              )}
              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-primary hover:bg-primary/90"
                    : plan.name === "Equity / CMS"
                    ? "bg-secondary text-muted-foreground hover:bg-secondary hover:text-muted-foreground cursor-pointer"
                    : "bg-primary hover:bg-primary/90"
                } transition-all duration-300`}
                onClick={() => {
                  if (plan.name === "Upfront") {
                    onOpenPayment("one-time");
                  } else if (plan.name === "Monthly") {
                    onOpenPayment("monthly", monthlyBilling);
                  } else if (plan.name === "Equity / CMS") {
                    setShowComingSoon(true);
                  }
                }}
              >
                Go Live
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
                  The Equity / CMS plan is currently in development. We're working hard to bring you an exciting new way to partner with us!
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  In the meantime, check out our <button type="button" onClick={() => { setShowComingSoon(false); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-primary font-semibold underline">available</button> plans.
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

      {/* Equity/CMS popup — rendered at section level to avoid scroll glitch */}
      {showEquityCmsPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowEquityCmsPopup(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">What are these plans?</h3>
            <div className="mb-3">
              <span className="font-semibold text-primary block mb-1">Equity Plan</span>
              <span className="text-sm text-muted-foreground block">
                Partner with us through a small equity share or revenue percentage. Perfect for startups and growing businesses looking to minimize upfront costs while investing in their online presence.
              </span>
            </div>
            <div className="mb-5">
              <span className="font-semibold text-primary block mb-1">CMS Plan</span>
              <span className="text-sm text-muted-foreground block">
                Take control of your content with our built-in content management system. Update text, images, and more anytime — no revision requests needed.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowEquityCmsPopup(false)}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
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

  // Domain validation regex
  const validateDomainFormat = (domain: string): boolean => {
    if (!domain.trim()) return true; // Empty is handled by required validation
    // Domain pattern: alphanumeric, hyphens, with a valid TLD
    const domainPattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;
    return domainPattern.test(domain);
  };

  // Check domain availability using DNS lookup simulation
  const checkDomainAvailability = async (domain: string) => {
    if (!domain.trim() || !validateDomainFormat(domain)) {
      setDomainAvailability(null);
      return;
    }

    setCheckingDomain(true);
    setDomainAvailability(null);

    try {
      // Use a DNS-over-HTTPS service to check if domain resolves
      // This is a simple heuristic - if it resolves, it's likely taken
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
        { method: "GET" }
      );

      if (response.ok) {
        const data = await response.json();
        // If there are Answer records, the domain likely exists (taken)
        if (data.Answer && data.Answer.length > 0) {
          setDomainAvailability("unavailable");
        } else if (data.Status === 3) {
          // NXDOMAIN - domain doesn't exist, might be available
          setDomainAvailability("available");
        } else {
          // Other statuses - check WHOIS for more accuracy
          // For now, we'll suggest it might be available but recommend verification
          setDomainAvailability("available");
        }
      } else {
        // On error, suggest checking manually
        setDomainAvailability(null);
      }
    } catch (error) {
      // On network error, suggest checking manually
      console.error("Domain check error:", error);
      setDomainAvailability(null);
    } finally {
      setCheckingDomain(false);
    }
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

    // For Google Business, validate it's a valid Google URL
    if (platform === 'googleBusiness') {
      const googleUrlPattern = /^https?:\/\/(www\.)?google\.(com|[a-z]{2,3})\/maps\//i;
      const googleSearchPattern = /^https?:\/\/(www\.)?google\.(com|[a-z]{2,3})\/search\?/i;
      const isValidGoogleUrl = googleUrlPattern.test(username) || googleSearchPattern.test(username) || username.includes('maps.app.goo.gl') || username.includes('g.page') || username.includes('business.google');
      return isValidGoogleUrl;
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

    setValidatingSocial(prev => ({ ...prev, [platform]: true }));

    const isValid = await validateSocialMediaUrl(platform, value);

    setValidatingSocial(prev => ({ ...prev, [platform]: false }));

    if (!isValid) {
      if (platform === 'googleBusiness') {
        setErrors(prev => ({ ...prev, [platform]: "Please enter a valid Google Business URL" }));
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
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phone = formData.phone.trim();

      const format1 = /^\d{10}$/;
      const format2 = /^\d{3}-\d{3}-\d{4}$/;
      const format3 = /^\+1 \(\d{3}\) \d{3}-\d{4}$/;

      if (!format1.test(phone) && !format2.test(phone) && !format3.test(phone)) {
        const validChars = /^[\d\s\-\+\(\)]+$/;
        if (!validChars.test(phone)) {
          newErrors.phone = "Phone number can only contain numbers, hyphens, parentheses, spaces, and + for country code";
        } else {
          const digitsOnly = phone.replace(/\D/g, '');

          if (phone.startsWith('+') && !phone.startsWith('+1')) {
            newErrors.phone = "Only USA phone numbers (+1) are accepted at this time";
          } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
            newErrors.phone = "Please use format: +1 (xxx) xxx-xxxx, xxx-xxx-xxxx, or xxxxxxxxxx";
          } else if (digitsOnly.length !== 10 && !(digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
            newErrors.phone = "Phone number must be 10 digits (or 11 with +1 country code)";
          } else {
            newErrors.phone = "Please use format: +1 (xxx) xxx-xxxx, xxx-xxx-xxxx, or xxxxxxxxxx";
          }
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
    }
    if (ownsDomain && !existingDomain.trim()) {
      newErrors.existingDomain = "Please enter your existing domain";
    }

    if (!formData.paymentPlan) {
      newErrors.paymentPlan = "Payment plan is required";
    }
    if (!formData.message.trim()) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("https://formspree.io/f/xnjobyzd", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          domain: ownsDomain ? "" : formData.domain,
          paymentPlan: formData.paymentPlan,
          message: formData.message,
          instagram: formData.instagram,
          facebook: formData.facebook,
          twitter: formData.twitter,
          youtube: formData.youtube,
          tiktok: formData.tiktok,
          linkedin: formData.linkedin,
          googleBusiness: formData.googleBusiness,
          ownsDomain: ownsDomain ? "yes" : "no",
          existingDomain: ownsDomain ? existingDomain : "",
          _replyto: formData.email,
          _subject: `New GimmeASite Inquiry from ${formData.name}`,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setShowSubmitToast(true);
        onSuccess?.();
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
      } else {
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
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }
    // Reset domain availability when typing
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
    <section id="contact" className="py-32 relative noise-bg">
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

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <Badge variant="secondary" className="mb-4">Get In Touch</Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Ready to Start
              <br />
              Your <span className="gradient-text">Project?</span>
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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Mon - Fri</div>
                  <div className="text-sm text-muted-foreground">9AM - 5PM EST</div>
                  <div className="text-xs text-muted-foreground italic">Closed on holidays</div>
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className={`bg-background ${errors.name ? "border-red-500" : ""}`}
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
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
                      <label htmlFor="phone" className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={(e) => { e.preventDefault(); setShowWhyPopup("phone"); }}
                      >?</button>
                    </div>
                    <Input
                      id="phone"
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
                      type="text"
                      placeholder="Your Company"
                      className="bg-background"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Domain Field */}
                {!ownsDomain && <div className="relative">
                  <div className="flex items-center gap-1.5 mb-2">
                    <label htmlFor="domain" className="text-sm font-medium">Desired Domain <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={(e) => { e.preventDefault(); setShowWhyPopup("domain"); }}
                    >?</button>
                  </div>
                  <div className="relative flex gap-2">
                    <Input
                      id="domain"
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

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
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
                      What is the domain? <span className="text-red-500">*</span>
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

                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-2">
                    <label className="text-sm font-medium">Payment Plan <span className="text-red-500">*</span></label>
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
                        {formData.paymentPlan || "Select a plan"}
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
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${
                            formData.paymentPlan === "Hybrid" ? "bg-primary/10 text-primary" : ""
                          }`}
                          onClick={() => handlePlanSelect("Hybrid")}
                        >
                          Hybrid
                        </button>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${
                            formData.paymentPlan === "Annual" ? "bg-primary/10 text-primary" : ""
                          }`}
                          onClick={() => handlePlanSelect("Annual")}
                        >
                          Annual
                        </button>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-muted-foreground/50 cursor-not-allowed"
                          disabled
                        >
                          Equity / CMS <span className="text-xs ml-1">(Coming soon)</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.paymentPlan && <p className="text-red-500 text-xs mt-1">{errors.paymentPlan}</p>}
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Tell us about your project <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Describe what type of business you run, your website ideas, and any other specific requirements..."
                    className={`bg-background min-h-[150px] ${errors.message ? "border-red-500" : ""}`}
                    value={formData.message}
                    onChange={handleChange}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

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
                          type="text"
                          placeholder="username"
                          className={`bg-background rounded-l-none ${errors.linkedin ? "border-red-500" : ""}`}
                          value={formData.linkedin}
                          onChange={handleChange}
                          onBlur={e => handleSocialBlur("linkedin", e.target.value)}
                        />
                      </div>
                      {errors.linkedin && <p className="text-red-500 text-xs mt-1">{errors.linkedin}</p>}
                    </div>
                  </div>
                  <div className="mt-4 relative">
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
                      type="text"
                      placeholder="Paste your Google Business or Maps link"
                      className={`bg-background ${errors.googleBusiness ? "border-red-500" : ""}`}
                      value={formData.googleBusiness}
                      onChange={handleChange}
                      onBlur={e => handleSocialBlur("googleBusiness", e.target.value)}
                    />
                    {errors.googleBusiness && <p className="text-red-500 text-xs mt-1">{errors.googleBusiness}</p>}
                  </div>
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
                  <p className="text-sm text-red-500 text-center -mt-2">{errors.submit}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>

      {/* Unified Why? popup */}
      {showWhyPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowWhyPopup(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3">
              {showWhyPopup === "domain" ? "What is a domain?" : showWhyPopup === "phone" ? "Work, Home, or Mobile?" : showWhyPopup === "plan" ? "Unsure?" : showWhyPopup === "google" ? "Where do I find this link?" : showWhyPopup === "ownsDomain" ? "What is this for?" : "Why?"}
            </h3>
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
                  </ul>
                  <p className="text-xs border-t border-border/50 pt-2">GimmeASite uses Instant Domain Search to check availability. Please note that the availability check is not 100% accurate — your chosen domain may need to be adjusted later in the process.</p>
                </div>
              )}
              {showWhyPopup === "ownsDomain" && (
                <div className="space-y-3">
                  <p>Check this box if we&apos;re redesigning your existing site and you want to keep your current domain.</p>
                  <p>Already owning your domain will result in <span className="font-semibold text-foreground">savings</span> for you — since we won&apos;t need to acquire it on your behalf, it won&apos;t be factored into our price.</p>
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
                  <li>Copy and paste the link here</li>
                </ol>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowWhyPopup(null)}
              className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// Footer
function Footer({ onOpenFaq, onOpenPrivacyPolicy }: { onOpenFaq: () => void; onOpenPrivacyPolicy: () => void }) {
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
                <li><button type="button" onClick={() => scrollToSection("services")} className="hover:text-foreground transition-colors">Web Design</button></li>
                <li><button type="button" onClick={() => scrollToSection("services")} className="hover:text-foreground transition-colors">Hosting</button></li>
                <li><button type="button" onClick={() => scrollToSection("services")} className="hover:text-foreground transition-colors">Maintenance</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><button type="button" onClick={() => scrollToSection("about")} className="hover:text-foreground transition-colors">About</button></li>
                <li><button type="button" onClick={() => scrollToSection("contact")} className="hover:text-foreground transition-colors">Contact</button></li>
                <li><Link href="/faq" onClick={(e) => { e.preventDefault(); onOpenFaq(); }} className="hover:text-foreground transition-colors">FAQ</Link></li>
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
              <p><strong className="text-foreground">Last Updated:</strong> April 2026</p>

              <p>Welcome to GimmeASite. By using our services, you agree to be bound by these Terms of Service.</p>

              <h4 className="text-foreground font-semibold mt-6">Services</h4>
              <p>GimmeASite provides web design and development services. The specific scope of work will be outlined in individual project agreements or quotes provided to you.</p>

              <h4 className="text-foreground font-semibold mt-6">Payment Terms</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment is required as specified in your project agreement</li>
                <li>For monthly plans, recurring payments will be charged on the agreed billing date</li>
                <li>Upfront fees are due upon project completion unless otherwise agreed</li>
              </ul>

              <h4 className="text-foreground font-semibold mt-6">Intellectual Property</h4>
              <p>Upon full payment, you will own the rights to your completed website design and content. We retain the right to display the work in our portfolio unless otherwise agreed.</p>

              <h4 className="text-foreground font-semibold mt-6">Revisions and Support</h4>
              <p>Each project includes a reasonable number of revisions as specified in your plan, as well as a designated support period. Additional revisions and continued support outside of your plan may incur extra charges.</p>

              <h4 className="text-foreground font-semibold mt-6">Limitation of Liability</h4>
              <p>GimmeASite's liability is limited to the amount paid for services. We are not liable for indirect, incidental, or consequential damages.</p>

              <h4 className="text-foreground font-semibold mt-6">Service Availability and Technical Issues</h4>
              <p>GimmeASite makes no warranties regarding the uninterrupted availability, error-free operation, or absolute security of any website we deliver. We are not responsible for losses arising from security incidents caused by third parties, technical issues resulting from browser or platform updates outside our control, hosting or DNS outages, or reliance on content displayed on a delivered website. Our total liability shall not exceed the fees paid for the specific service giving rise to the claim.</p>

              <h4 className="text-foreground font-semibold mt-6">Refund Policy</h4>
              <p>All sales are final. GimmeASite does not offer refunds once payment has been processed. For monthly subscribers, you may cancel your subscription at any time to prevent future charges, but no refunds will be issued for the current or any prior billing periods. If you are dissatisfied with your site prior to payment, we will work with you to make it right before any transaction takes place.</p>

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
function ThanksPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
              onClick={onClose}
            >
              Book a Call to Review Your Draft
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showFaqPopup, setShowFaqPopup] = useState(false);
  const [showThanksPopup, setShowThanksPopup] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPlanType, setPaymentPlanType] = useState<"one-time" | "monthly" | "bundle">("one-time");
  const [paymentBillingCycle, setPaymentBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [paymentStatus, setPaymentStatus] = useState<"success" | "cancelled" | null>(null);

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
      setShowFaqPopup(true);
      window.history.replaceState({}, document.title, window.location.pathname);
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
    } else if (modal === "payment-bundle") {
      setTimeout(() => {
        setPaymentPlanType("bundle");
        setPaymentModalOpen(true);
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

  const handleOpenFaq = () => setShowFaqPopup(true);
  const handleCloseFaq = () => setShowFaqPopup(false);
  const handleOpenPrivacyPolicy = () => {
    window.dispatchEvent(new Event('openPrivacyPolicy'));
  };

  const handleOpenPayment = (plan: "one-time" | "monthly" | "bundle", billing: "monthly" | "annual" = "monthly") => {
    setPaymentPlanType(plan);
    setPaymentBillingCycle(billing);
    setPaymentModalOpen(true);
  };

  const handleClosePayment = () => {
    setPaymentModalOpen(false);
  };

  return (
    <main className="min-h-screen">
      <Navigation onOpenFaq={handleOpenFaq} />
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
      <AboutUsSection />
      <PricingSection onOpenPayment={handleOpenPayment} />
      <ContactSection onSuccess={() => setShowThanksPopup(true)} />
      <Footer onOpenFaq={handleOpenFaq} onOpenPrivacyPolicy={handleOpenPrivacyPolicy} />
      <FaqPopup isOpen={showFaqPopup} onClose={handleCloseFaq} />
      <ThanksPopup isOpen={showThanksPopup} onClose={() => setShowThanksPopup(false)} />
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
