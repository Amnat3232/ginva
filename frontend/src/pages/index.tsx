import React from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";

export default function LandingPage() {
  const stats = [
    { value: "$2.4M", label: "TVL" },
    { value: "1,240", label: "เงินกู้ที่ใช้งาน" },
    { value: "0", label: "การยึดทันที" },
    { value: "65.25%", label: "ส่วนแบ่งผู้สนับสนุน" },
  ];

  const steps = [
    { icon: "🏦", title: "ฝากหลักประกัน", desc: "SOL, BTC, ETH" },
    { icon: "💰", title: "รับ USDC ทันที", desc: "สูงสุด 60% ของมูลค่า" },
    { icon: "🛡️", title: "ปลอดภัย 72 ชม.", desc: "ไม่มีการยึดทันที" },
  ];

  const pillars = [
    {
      icon: "👤",
      title: "ผู้กู้",
      subtitle: "หัวใจ",
      features: ["กู้เงิน", "ได้รับการปกป้อง", "72 ชม. รับมือ"],
    },
    {
      icon: "💰",
      title: "ผู้สนับสนุน",
      subtitle: "เส้นเลือดใหญ่",
      features: ["Stake USDC", "รายได้ 65.25%", "ไม่มีล็อก"],
    },
    {
      icon: "🤖",
      title: "ผู้ช่วยเหลือ",
      subtitle: "ผู้พิทักษ์",
      features: ["ตรวจสอบ", "ช่วยเหลือ", "รับรางวัล"],
    },
  ];

  return (
    <Layout title="GINVA - กู้เงินด้วยสินทรัพย์ดิจิทัล">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-display font-bold mb-6">
            <span className="text-ginva-gold">GINVA</span>
          </h1>

          <p className="text-xl sm:text-2xl text-ginva-silver mb-4 max-w-3xl mx-auto">
            "กระจายรายได้ ส่งมอบความสุข ให้ความปลอดภัย สร้างความไว้วางใจ"
          </p>

          <p className="text-lg text-ginva-silver/80 mb-8 max-w-2xl mx-auto">
            กู้เงินด้วยสินทรัพย์ดิจิทัลโดยไม่ต้องขาย พร้อมระบบปกป้อง 72
            ชั่วโมงที่เป็นเอกลักษณ์
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="primary" size="lg">
              🚀 เริ่มกู้เงิน
            </Button>
            <Button variant="outline" size="lg">
              💰 เป็นผู้สนับสนุน
            </Button>
          </div>

          {/* Protection Badge */}
          <Card className="max-w-xl mx-auto mb-12 bg-gradient-to-r from-ginva-cyan/10 to-ginva-navy border-ginva-cyan/30">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🛡️</span>
              <div className="text-left">
                <p className="font-semibold text-ginva-cyan">
                  ระบบปกป้อง 72 ชั่วโมง
                </p>
                <p className="text-sm text-ginva-silver">
                  ไม่มีการยึดทันที คุณมีเวลาในการรับมือ
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
            วิธีใช้งานง่ายๆ ใน 3 ขั้นตอน
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center relative">
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-ginva-gold rounded-full flex items-center justify-center text-ginva-navy font-bold">
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
              💡 <span className="text-ginva-gold">ตัวอย่าง:</span> ฝาก ETH 5
              ตัว ($500) → รับ USDC 300 → มีเวลา 72 ชม. ในการรับมือหากราคาตก
            </p>
          </Card>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-4">
            🌳 ระบบนิเวศที่เกื้อกูลกัน
          </h2>
          <p className="text-center text-ginva-silver mb-12">
            ทุกคนคือส่วนสำคัญที่ขาดไม่ได้
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <Card key={index} className="text-center">
                <div className="text-5xl mb-4">{pillar.icon}</div>
                <h3 className="text-xl font-semibold mb-1">{pillar.title}</h3>
                <p className="text-ginva-gold text-sm mb-4">
                  {pillar.subtitle}
                </p>
                <ul className="space-y-2 text-ginva-silver">
                  {pillar.features.map((feature, idx) => (
                    <li key={idx}>• {feature}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-ginva-slate/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            ทำไมต้องเลือก GINVA?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-2">ปลอดภัยกว่า</h3>
              <p className="text-ginva-silver">
                72 ชั่วโมงในการรับมือ ไม่มีการยึดทันที
              </p>
            </Card>
            <Card className="text-center">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-2">โปร่งใส</h3>
              <p className="text-ginva-silver">
                ไม่มีค่าธรรมเนียมแอบแฝง ตรวจสอบได้ทุกธุรกรรม
              </p>
            </Card>
            <Card className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">รวดเร็ว</h3>
              <p className="text-ginva-silver">
                อนุมัติทันที ไม่ต้องรอ ไม่มีเอกสาร
              </p>
            </Card>
          </div>

          {/* Testimonial */}
          <Card className="max-w-3xl mx-auto bg-ginva-navy/50">
            <div className="text-center">
              <p className="text-lg text-ginva-silver mb-4">
                "ตอนแรกกลัวโดนยึดทรัพย์เหมือนแพลตฟอร์มอื่น แต่พอรู้ว่ามีเวลา 72
                ชั่วโมง รู้สึกสบายใจมาก"
              </p>
              <p className="text-ginva-gold">— คุณ Alex, ผู้กู้</p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
            พร้อมที่จะเริ่มต้นแล้วหรือยัง?
          </h2>
          <p className="text-xl text-ginva-silver mb-8">
            เข้าร่วมกับระบบนิเวศที่ยุติธรรมและโปร่งใส
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg">
              🚀 เริ่มกู้เงินเลย
            </Button>
            <Button variant="outline" size="lg">
              📖 อ่านเพิ่มเติม
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
