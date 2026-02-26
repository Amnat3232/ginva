import React from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";
import Icon from "../components/Icon";

export default function LandingPage() {
  const stats = [
    { value: "$2.4M", label: "TVL" },
    { value: "1,240", label: "Active Loans" },
    { value: "0", label: "Instant Seizures" },
    { value: "65.25%", label: "Supporter Share" },
  ];

  const steps = [
    {
      title: "Deposit Collateral",
      desc: "SOL, BTC, ETH",
      icon: "building-library",
    },
    { title: "Get USDC Instantly", desc: "Up to 60% of value", icon: "coins" },
    { title: "72h Protection", desc: "No instant seizure", icon: "shield" },
  ];

  const pillars = [
    {
      icon: "user",
      title: "Borrowers",
      subtitle: "Heart",
      features: ["Borrow money", "Get protected", "72h to respond"],
    },
    {
      icon: "currency-dollar",
      title: "Supporters",
      subtitle: "Lifeblood",
      features: ["Stake USDC", "65.25% revenue", "No lock-up"],
    },
    {
      icon: "robot",
      title: "Helpers",
      subtitle: "Guardians",
      features: ["Monitor", "Assist", "Earn rewards"],
    },
  ];

  return (
    <Layout title="GINVA - Digital Asset Lending">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-display font-bold mb-6">
            <span className="text-ginva-gold">GINVA</span>
          </h1>

          <p className="text-xl sm:text-2xl text-ginva-silver mb-4 max-w-3xl mx-auto">
            "Distribute Income. Deliver Happiness. Provide Safety. Build Trust"
          </p>

          <p className="text-lg text-ginva-silver/80 mb-8 max-w-2xl mx-auto">
            Borrow using digital assets without selling, with unique 72-hour
            protection system
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="primary" size="lg">
              <Icon name="bolt" size="sm" className="mr-2" ariaLabel="" />
              Start Borrowing
            </Button>
            <Button variant="outline" size="lg">
              <Icon
                name="currency-dollar"
                size="sm"
                className="mr-2"
                ariaLabel=""
              />
              Become a Supporter
            </Button>
          </div>

          {/* Protection Badge */}
          <Card className="max-w-xl mx-auto mb-12 bg-gradient-to-r from-ginva-cyan/10 to-ginva-navy border-ginva-cyan/30">
            <div className="flex items-center justify-center space-x-3">
              <Icon
                name="shield"
                size="xl"
                className="text-ginva-cyan"
                ariaLabel="Protection"
              />
              <div className="text-left">
                <p className="font-semibold text-ginva-cyan">
                  72-Hour Protection System
                </p>
                <p className="text-sm text-ginva-silver">
                  No instant seizure - You have time to respond
                </p>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <p className="text-2xl sm:text-3xl font-mono font-bold text-ginva-gold">
                  {stat.value}
                </p>
                <p className="text-sm text-ginva-silver mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-ginva-slate/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Easy 3-Step Process
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center relative">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-ginva-gold/20 flex items-center justify-center">
                    <Icon
                      name={step.icon as any}
                      size="xl"
                      className="text-ginva-gold"
                      ariaLabel=""
                    />
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-ginva-gold rounded-full flex items-center justify-center text-ginva-navy font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-ginva-silver">{step.desc}</p>
              </Card>
            ))}
          </div>

          {/* Example */}
          <Card className="mt-8 max-w-2xl mx-auto bg-ginva-navy/50">
            <p className="text-ginva-silver text-center">
              <Icon
                name="light-bulb"
                size="md"
                className="text-ginva-gold mr-2 inline"
                ariaLabel="Tip"
              />
              <span className="text-ginva-gold font-medium">Example:</span>{" "}
              Deposit 5 ETH ($500) → Receive $300 USDC → Have 72 hours to
              respond if price drops
            </p>
          </Card>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-4">
            Balanced Ecosystem
          </h2>
          <p className="text-center text-ginva-silver mb-12">
            Everyone is equally important
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <Card key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-ginva-cyan/20 flex items-center justify-center">
                    <Icon
                      name={pillar.icon as any}
                      size="xl"
                      className="text-ginva-cyan"
                      ariaLabel=""
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">{pillar.title}</h3>
                <p className="text-ginva-gold text-sm mb-4">
                  {pillar.subtitle}
                </p>
                <ul className="space-y-2 text-ginva-silver">
                  {pillar.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center">
                      <Icon
                        name="check"
                        size="xs"
                        className="text-ginva-cyan mr-2"
                        ariaLabel=""
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* trust signals */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-ginva-slate/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Why Choose GINVA?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-ginva-cyan/20 flex items-center justify-center">
                  <Icon
                    name="shield"
                    size="xl"
                    className="text-ginva-cyan"
                    ariaLabel=""
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Safer</h3>
              <p className="text-ginva-silver">
                72 hours to respond, no instant seizure
              </p>
            </Card>
            <Card className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-ginva-cyan/20 flex items-center justify-center">
                  <Icon
                    name="eye"
                    size="xl"
                    className="text-ginva-cyan"
                    ariaLabel=""
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparent</h3>
              <p className="text-ginva-silver">
                No hidden fees, all transactions verifiable
              </p>
            </Card>
            <Card className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-ginva-cyan/20 flex items-center justify-center">
                  <Icon
                    name="bolt"
                    size="xl"
                    className="text-ginva-cyan"
                    ariaLabel=""
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast</h3>
              <p className="text-ginva-silver">
                Instant approval, no waiting, no documents
              </p>
            </Card>
          </div>

          {/* Testimonial */}
          <Card className="max-w-3xl mx-auto bg-ginva-navy/50">
            <div className="text-center">
              <Icon
                name="quote"
                size="lg"
                className="text-ginva-gold mx-auto mb-4"
                ariaLabel=""
              />
              <p className="text-lg text-ginva-silver mb-4">
                "At first I was afraid of getting seized like other platforms,
                but knowing I have 72 hours made me feel much better"
              </p>
              <p className="text-ginva-gold font-medium">— Alex, Borrower</p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-ginva-silver mb-8">
            Join a fair and transparent ecosystem
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg">
              <Icon name="bolt" size="sm" className="mr-2" ariaLabel="" />
              Start Borrowing Now
            </Button>
            <Button variant="outline" size="lg">
              <Icon name="document" size="sm" className="mr-2" ariaLabel="" />
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
